# Ekara Incident Integration with Servicenow using Scripted REST API

This code is a template for integrating Ekara incident management with Servicenow using the Scripted REST API. The template includes functions for inserting and resolving incidents, as well as handling incoming payloads.

## How to use this template

1. Customize the `InsertEkaraPayload` function to suit your specific needs. This function parses the incoming payload, builds an incident record, and inserts or resolves the incident based on the alert status.

2. Set the `resolveIncidents` variable to `true` or `false` depending on whether you want to enable or disable incident resolution.

3. Update the `process` function to handle the incoming request and response objects. This function calls the `InsertEkaraPayload` function and logs the incident number and message.

4. Deploy the scripted REST API in your Servicenow instance and configure it to listen for incoming requests from Ekara.

## Prerequisites

- Servicenow instance with Scripted REST API enabled
- Basic understanding of JavaScript and Servicenow scripting

## Installation

1. Clone this repository to your local machine.
2. Navigate to the project directory in your terminal.
3. Install the dependencies using npm or pnpm:
   `npm install`
   or
   `pnpm install`
4. Run the build command to generate the main.js file:
   `npm run build`
   or
   `pnpm run build`
5. Copy the contents of the [link](./build/main.js).
6. Open the Scripted REST API configuration in your Servicenow instance and create a new scripted REST API.
7. In the scripted REST API configuration, set the following properties:

Request method: POST<br />
Request URL: /ekara-integration<br />

8. Paste the code from step 6 into the new method and save and publish the scripted REST API.

## Usage

Configure Ekara to send POST requests to your Servicenow instance's scripted REST API endpoint (e.g., `https://your-servicenow-instance.com/ekara-integration`).

## Troubleshooting

If you encounter any issues while using this template, please refer to the Servicenow documentation or contact us.
