/**
 * This function builds an incident record based on the provided alert data.
 *
 * @param parsedPayload - The parsed alert data.
 * @returns A record containing the incident fields.
 */
function buildIncidentRecord(
  parsedPayload: AlertData
): Record<string, unknown> {
  const {
    alertStatus,
    scenario,
    product,
    alertType,
    application,
    triggerEvents,
    alertId,
    alertRuleId,
    startTime,
    endTime,
    end_alert_reasons,
    account
  } = parsedPayload;

  // Add and customize fields as needed based on your specific use case.

  const incidentRecord = {
    caller_id: gs.getUserID(),
    state: 'in-progress',
    comments: `${scenario.scenarioName} failed`,
    short_description:
      `An alert has been triggered for the scenario ${scenario.scenarioName}` ||
      'Alert Description Not Provided',
    category: 'software',
    impact: 1,
    urgency: 1,
    description: JSON.stringify({
      alertStatus,
      alertId,
      product,
      alertType,
      application,
      triggerEvents,
      alertRuleId,
      startTime,
      endTime,
      end_alert_reasons,
      account
    })
  };

  return incidentRecord;
}

/**
 * Inserts a new record into the specified table in ServiceNow.
 *
 * @param tableName - The name of the table where the record will be inserted.
 * @param fields - An object containing the fields and their values for the new record.
 * @returns The number of the newly inserted record.
 */
function insertGlideRecord(
  tableName: string,
  fields: Record<string, unknown>
): string {
  const gr = new GlideRecord(tableName);
  gr.initialize();
  for (const key in fields) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      gr.setValue(key, fields[key]);
    }
  }
  gr.insert();
  return gr.getValue('number');
}

/**
 * Finds an incident record by its alertId in the 'incident' table.
 *
 * @param alertId - The unique identifier of the incident to be found.
 * @returns The GlideRecord object of the found incident, or undefined if no matching incident is found.
 */
function findIncident(alertId: string): servicenow.GlideRecord | undefined {
  const gr = new GlideRecord('incident');
  gr.addQuery('description', 'CONTAINS', alertId);
  gr.query();

  if (gr.next()) {
    return gr;
  } else {
    return undefined;
  }
}

/**
 * Resolves an incident record by its alertId in the 'incident' table.
 *
 * @param parsedPayload - The parsed alert data containing the alertId.
 * @returns A customResponse object containing the incident number and a message.
 */
function resolveIncident(parsedPayload: AlertData): {
  incidentNumber: string;
  message: string;
} {
  const { alertId, scenario } = parsedPayload;
  const incident = findIncident(alertId);

  if (incident) {
    if (Number(incident.getValue('state')) === 6)
      return {
        incidentNumber: incident.getValue('number'),
        message: 'Incident already resolved'
      };
    incident.setValue('state', 6);
    incident.setValue(
      'comments',
      `${scenario.scenarioName} has been resolved.`
    );
    incident.setValue(
      'close_notes',
      'Incident resolved automatically via script'
    );
    incident.setValue('closed_at', new GlideDateTime());
    incident.update();

    return {
      incidentNumber: incident.getValue('number'),
      message: 'Incident resolved successfully'
    };
  }
  return { incidentNumber: null, message: 'No matching incident found.' };
}

/**
 * Inserts a new record into the specified table in ServiceNow.
 *
 * @param tableName - The name of the table where the record will be inserted.
 * @param payload - The payload containing the alert data.
 * @param resolveIncidents - A boolean flag indicating whether to resolve incidents.
 * @returns A customResponse object containing the incident number and a message.
 */
function InsertEkaraPayload(
  tableName: string,
  payload: string,
  resolveIncidents: boolean = true
): customResponse {
  let parsedPayload: AlertData;
  try {
    parsedPayload = JSON.parse(payload) as AlertData;
  } catch (error) {
    return { incidentNumber: '', message: 'Invalid payload format' };
  }

  const fields = buildIncidentRecord(parsedPayload);

  try {
    if (parsedPayload.alertStatus === 'Start') {
      const existingIncident = findIncident(parsedPayload.alertId);
      if (existingIncident) {
        return {
          incidentNumber: existingIncident.getValue('number'),
          message: 'Cannot start a new incident when alertId already exists.'
        };
      }
      const incidentNumber = insertGlideRecord(tableName, fields);
      return {
        incidentNumber,
        message: 'Record inserted successfully'
      };
    }
    if (parsedPayload.alertStatus === 'End' && resolveIncidents) {
      return resolveIncident(parsedPayload);
    }
    return {
      incidentNumber: '',
      message: resolveIncidents
        ? 'Invalid alertStatus. Must be "Start" or "End".'
        : 'Incident resolution is disabled.'
    };
  } catch (error) {
    return {
      incidentNumber: '',
      message: error instanceof Error ? error.message : 'Internal error'
    };
  }
}

/**
 * Processes the incoming request and returns a custom response.
 *
 * @param request - The incoming REST API request.
 * @param response - The outgoing REST API response.
 * @returns A customResponse object containing the incident number and a message.
 */
(function process(
  /*RESTAPIRequest*/ request,

  /*RESTAPIResponse*/ response
): customResponse {
  const resolveIncidents = true; // or set to false to disable resolution
  const { incidentNumber, message } = InsertEkaraPayload(
    'incident',
    request.body.dataString,
    resolveIncidents
  );
  response;
  gs.info(`Incident number ${incidentNumber} : ${message}`);
  return { incidentNumber, message };

  // @ts-expect-error : specific use for servicenow scripted rest api
})(request, response);
