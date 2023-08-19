const cds = require('@sap/cds');
const moment = require('moment');
const { executeHttpRequest } = require("@sap-cloud-sdk/http-client");
const { retrieveJwt } = require('@sap-cloud-sdk/connectivity');
const destinationName = "SF_App";
module.exports = function () {
    this.on("syncShifts", async (req) => {
        try {
            const jwt = retrieveJwt(req);
            const destinationDetails = {
                destinationName,
                jwt
            }
            const shifts = await executeHttpRequest(destinationDetails,
                {
                    method: "GET",
                    url: "/odata/v2/WorkScheduleDayModel?$select=externalCode,externalName_defaultValue,crossMidnightAllowed,workingHours,timeRecordingVariant,shiftClassification,segments/WorkScheduleDayModel_externalCode,segments/externalCode,segments/startTime,segments/endTime,segments/duration,segments/category&$expand=segments&$format=json",
                    timeout: 60000,

                });
            const shiftsData = shifts.data.d.results;
            if (shiftsData.length > 0) {
                const nonColorTypes = ["NonWorking", "Type07"];
                const colorCodes = await SELECT.from("ColorCode").where({
                    colorType: { "not in": nonColorTypes }
                });
                const segmentData = [];
                const shiftData = shiftsData.map((shift, index) => {
                    let colorIndex = index;
                    if (colorIndex > 18) {
                        colorIndex = colorIndex - 19;
                    }
                    // Map each segment of the shift to a new array
                    shift.segments.results.forEach(segment => {
                        // Create an object for each segment
                        segmentData.push({
                            WorkScheduleDayModel_externalCode: segment.WorkScheduleDayModel_externalCode ?? "",
                            externalCode: segment.externalCode ?? "",
                            startTime: segment.startTime ?? "",
                            endTime: segment.endTime ?? "",
                            duration: segment.duration ?? 0,
                            category: segment.category ?? ""
                        });
                    });

                    // Create an object for each shift
                    const shiftEntry = {
                        externalCode: shift.externalCode ?? "",
                        crossMidnightAllowed: shift.crossMidnightAllowed ?? "",
                        externalName_defaultValue: shift.externalName_defaultValue ?? "",
                        workingHours: shift.workingHours ?? "",
                        shiftClassification: shift.shiftClassification ?? "",
                        timeRecordingVariant: shift.timeRecordingVariant ?? "",
                        colorCode: colorCodes[colorIndex].colorCode,
                        colorType: colorCodes[colorIndex].colorType
                    };
                    return shiftEntry;
                });
                await UPSERT.into("Shifts").entries(shiftData);
                await UPSERT.into("Segments").entries(segmentData);
                return "Data Synced"
            }
        } catch (error) {
            console.log(error);
            return error.message;
        }
    })
    
    this.on("syncJobs", async (req) => {
        try {
            const jwt = retrieveJwt(req);
            const destinationDetails = {
                destinationName,
                jwt
            }
            let top = 50, skip = 0;
            const JobsResponse = await executeHttpRequest(destinationDetails,
                {
                    method: "GET",
                    url: `/odata/v2/EmpJob?$format=json&$select=seqNumber,startDate,userId,company,employmentNav/personNav/personalInfoNav/firstName,employmentNav/personNav/personalInfoNav/lastName,companyNav/name_defaultValue,businessUnit,businessUnitNav/name_defaultValue,division,divisionNav/name_defaultValue,department,departmentNav/name_defaultValue,location,locationNav/name,position,positionNav/externalName_defaultValue,costCenter,costCenterNav/name_defaultValue,employeeClass,employeeClassNav/picklistLabels/label,employmentType,employmentTypeNav/picklistLabels/label,employmentNav/startDate,employmentNav/endDate,employmentNav/compInfoNav/payGroup,employmentNav/compInfoNav/payGroupNav/name_defaultValue,managerId,employmentNav/photoNav/width,employmentNav/photoNav/height&$expand=employmentNav,employmentNav/personNav,employmentNav/personNav/personalInfoNav,companyNav,businessUnitNav,divisionNav,departmentNav,locationNav,positionNav,costCenterNav,employeeClassNav,employeeClassNav/picklistLabels,employmentTypeNav,employmentTypeNav/picklistLabels,employmentNav,employmentNav/compInfoNav,employmentNav/compInfoNav/payGroupNav&$top=${top}&$skip=${skip}`,
                    timeout: 60000,

                });
            const JobsData = JobsResponse.data.d.results;
            if (JobsData.length > 0) {
                console.log("JobsData", JobsData);
                return JSON.stringify(JobsData);
            }
        } catch (error) {
            console.log(error);
            return error.message;
        }
    })
}