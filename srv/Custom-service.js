const cds = require('@sap/cds');
const { executeHttpRequest } = require("@sap-cloud-sdk/http-client");
const { getDestination, retrieveJwt } = require('@sap-cloud-sdk/connectivity');
const destinationName = "SF_App"
module.exports = function () {
    this.on("getShifts", async (req) => {
        try {
            const jwt = retrieveJwt(req);
            const destinationDetails = {
                destinationName,
                jwt
            }
            const destination = await getDestination(destinationDetails);
            const shifts = await executeHttpRequest(destinationDetails,
                {
                    method: "GET",
                    url: "/odata/v2/WorkScheduleDayModel?$select=externalCode,externalName_defaultValue,crossMidnightAllowed,workingHours,timeRecordingVariant,shiftClassification,segments/startTime,segments/endTime,segments/duration,segments/category&$expand=segments&$format=json",
                    timeout: 60000,

                });
            return shifts.data;
        } catch (error) {
            console.log(error);
            debugger;
        }
        debugger;
    })
}