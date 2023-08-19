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
            let top = 100, skip = 0;
            let JobsData = [];
            do {
                const JobsResponse = await executeHttpRequest(destinationDetails,
                    {
                        method: "GET",
                        url: `/odata/v2/EmpJob?$select=seqNumber,startDate,userId,company,employmentNav/personNav/personalInfoNav/firstName,employmentNav/personNav/personalInfoNav/lastName,companyNav/name_defaultValue,businessUnit,businessUnitNav/name_defaultValue,division,divisionNav/name_defaultValue,department,departmentNav/name_defaultValue,location,locationNav/name,position,positionNav/externalName_defaultValue,costCenter,costCenterNav/name_defaultValue,employeeClass,employeeClassNav/picklistLabels/label,employmentType,employmentTypeNav/picklistLabels/label,employmentNav/startDate,employmentNav/endDate,employmentNav/compInfoNav/payGroup,employmentNav/compInfoNav/payGroupNav/name_defaultValue,managerId,employmentNav/photoNav/width,employmentNav/photoNav/height,employmentNav/photoNav/mimeType,employmentNav/photoNav/photo&$expand=employmentNav,employmentNav/personNav,employmentNav/photoNav,employmentNav/personNav/personalInfoNav,companyNav,businessUnitNav,divisionNav,departmentNav,locationNav,positionNav,costCenterNav,employeeClassNav,employeeClassNav/picklistLabels,employmentTypeNav,employmentTypeNav/picklistLabels,employmentNav,employmentNav/compInfoNav,employmentNav/compInfoNav/payGroupNav&$top=${top}&$skip=${skip}`,
                        timeout: 60000,

                    });
                JobsData = JobsResponse.data.d.results;
                if (JobsData.length > 0) {
                    let mappedJobs = JobsData.map((item) => {
                        var employmentTypeName = "", businessUnitName = "", locationName = "", positionName = "", departmentName = "", divisionName = "", costCenterName = "", companyName = "", employeeClassName = "", employmentStartDate = "",
                            employmentEndDate = "", firstName = "", lastName = "", photo = "", mimeType = "";
                        // This code gets the first picklist label from the employmentTypeNav property of the item.
                        // The employmentTypeNav property contains picklist labels for the employmentType property of the item.
                        if (item.employmentType && item.employmentTypeNav && item.employmentTypeNav.picklistLabels && item.employmentTypeNav.picklistLabels.results && item.employmentTypeNav.picklistLabels.results.length > 0) {
                            employmentTypeName = item.employmentTypeNav.picklistLabels.results[0].label
                        }

                        if (item.businessUnitNav && item.businessUnitNav.name_defaultValue) {
                            businessUnitName = item.businessUnitNav.name_defaultValue;
                        }

                        if (item.locationNav && item.locationNav.name) {
                            locationName = item.locationNav.name;
                        }

                        if (item.divisionNav && item.divisionNav.name_defaultValue) {
                            divisionName = item.divisionNav.name_defaultValue;
                        }

                        if (item.positionNav && item.positionNav.externalName_defaultValue) {
                            positionName = item.positionNav.externalName_defaultValue;
                        }

                        if (item.costCenterNav && item.costCenterNav.name_defaultValue) {
                            costCenterName = item.costCenterNav.name_defaultValue;
                        }

                        if (item.employeeClassNav && item.employeeClassNav.picklistLabels && item.employeeClassNav.picklistLabels.results && item.employeeClassNav.picklistLabels.results.length > 0) {
                            employeeClassName = item.employeeClassNav.picklistLabels.results[0].label;
                        }

                        if (item.departmentNav && item.departmentNav.name_defaultValue) {
                            departmentName = item.departmentNav.name_defaultValue;
                        }

                        if (item.companyNav && item.companyNav.name_defaultValue) {
                            companyName = item.companyNav.name_defaultValue;
                        }

                        if (item.employmentNav) {
                            if (item.employmentNav.startDate) {
                                employmentStartDate = moment(item.employmentNav.startDate).format("YYYY-MM-DD HH:mm:ss.SSSSSSSSS");
                            } else {
                                // set date to 1900-01-01
                                employmentStartDate = moment("1900-01-01").format("YYYY-MM-DD HH:mm:ss.SSSSSSSSS");
                            }
                            if (item.employmentNav.endDate) {
                                employmentEndDate = moment(item.employmentNav.endDate).format("YYYY-MM-DD HH:mm:ss.SSSSSSSSS");
                            } else {
                                // set date to 9999-12-31
                                employmentEndDate = moment("9999-12-31").format("YYYY-MM-DD HH:mm:ss.SSSSSSSSS");
                            }
                            if (item.employmentNav.personNav && item.employmentNav.personNav.personalInfoNav && item.employmentNav.personNav.personalInfoNav.results && item.employmentNav.personNav.personalInfoNav.results.length > 0) {
                                if (item.employmentNav.personNav.personalInfoNav.results[0].firstName) {
                                    firstName = item.employmentNav.personNav.personalInfoNav.results[0].firstName;
                                }
                                if (item.employmentNav.personNav.personalInfoNav.results[0].lastName) {
                                    lastName = item.employmentNav.personNav.personalInfoNav.results[0].lastName;
                                }
                            }
                            if (item.employmentNav.photoNav && item.employmentNav.photoNav.results && item.employmentNav.photoNav.results.length > 0) {
                                let photos = item.employmentNav.photoNav.results;
                                const filtered = photos.filter(item => item.photo);
                                //sort photos by highest width and height
                                const sorted = filtered.sort((a, b) => {
                                    if (a.width > b.width) {
                                        return -1;
                                    } else if (a.width < b.width) {
                                        return 1;
                                    } else {
                                        if (a.height > b.height) {
                                            return -1;
                                        } else if (a.height < b.height) {
                                            return 1;
                                        } else {
                                            return 0;
                                        }
                                    }
                                })[0];
                                if (sorted) {
                                    photo = sorted.photo.replace(/\r\n/g, "");
                                    mimeType = sorted.mimeType;
                                }
                            }
                        }

                        return {
                            "userId": item.userId,
                            "seqNumber": item.seqNumber,
                            "startDate": moment(item.startDate).format("YYYY-MM-DD HH:mm:ss.SSSSSSSSS"),
                            "employeeClass": item.employeeClass,
                            "businessUnit": item.businessUnit,
                            "employmentType": item.employmentType,
                            "costCenter": item.costCenter,
                            "managerId": item.managerId,
                            "division": item.division,
                            "company": item.company,
                            "location": item.location,
                            "position": item.position,
                            "department": item.department,
                            employmentTypeName,
                            businessUnitName,
                            locationName,
                            positionName,
                            departmentName,
                            divisionName,
                            costCenterName,
                            companyName,
                            employeeClassName,
                            employmentStartDate,
                            employmentEndDate,
                            firstName,
                            lastName,
                            photo,
                            mimeType
                        }
                    });
                    await UPSERT.into("Jobs").entries(mappedJobs);
                    skip = skip + top;
                }
            } while (JobsData.length != 0);
            return "Data Synced"
        } catch (error) {
            console.log(error);
            return error.message;
        }
    })
}