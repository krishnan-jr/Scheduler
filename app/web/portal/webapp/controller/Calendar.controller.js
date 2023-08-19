sap.ui.define([
        "sap/ui/core/library",
        "sap/ui/core/Fragment",
        "sap/ui/core/mvc/Controller",
        "sap/ui/core/format/DateFormat",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageToast",
        "sap/m/MessageBox"
    ],
    function(library,
        Fragment,
        Controller,
        DateFormat,
        JSONModel,
        MessageToast,
        MessageBox) {
        "use strict";

        return Controller.extend("calendar.controller.Calendar", {
            /**
             * @override
             */
            onBeforeRendering: function() {
                this.byId("container-calendar---Calendar--PC1-Header-NavToolbar-PickerBtn").setVisible(false);
                const newStartDate = this.byId("PC1").getStartDate(),
                    year = newStartDate.getFullYear(),
                    monthName = newStartDate.toLocaleString('default', { month: 'long' });
                this.byId("PC1")._oTodayButton.setText(monthName + ' ' + year);
            },
            onInit: async function() { // create model
                this.shiftModel = new JSONModel();
                await this.shiftModel.loadData("../model/shifts.json");
                this.shiftModel.setData(this.shiftModel.getData().d.results);
                this.getView().setModel(this.shiftModel, "shiftModel");

                this.employeeModel = new JSONModel();
                await this.employeeModel.loadData("../model/employee.json");
                this.employeeModel.setData(this.employeeModel.getData().d.results);
                this.getView().setModel(this.employeeModel, "employeeModel");

                this.employeeLeaveModel = new JSONModel();
                await this.employeeLeaveModel.loadData("../model/employeeLeave.json");
                this.employeeLeaveModel.setData(this.employeeLeaveModel.getData().d.results);
                this.getView().setModel(this.employeeLeaveModel, "employeeLeaveModel");

                this._convertEmpDataToNewFormat(this.employeeModel.getData(), this.employeeLeaveModel.getData());

                this.apptDetailModel = new JSONModel();
                this.getView().setModel(this.apptDetailModel, "apptDetailModel");

                this.empDetailModel = new JSONModel();
                this.getView().setModel(this.empDetailModel, "empDetailModel");

                const convertedShiftData = this._convertDataToNewFormat(this.shiftModel.getData());
                this.shiftModel.setData(convertedShiftData);
            },
            /**Add special Dates to existing array*/
            _convertEmpDataToNewFormat: function(empDate, empLeaveData) {
                const extractedData = empLeaveData.map(result => {
                    const startDate = new Date(parseInt(result.startDate.slice(6, -2))),
                        endDate = new Date(parseInt(result.endDate.slice(6, -2)));
                    return {
                        externalName: result.timeTypeNav.externalName_localized,
                        approvalStatus: result.approvalStatus,
                        startDate: new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()),
                        endDate: new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()),
                        type: "Type07",
                        leave: true,
                        title: "Leave"
                    };
                });
                empDate.forEach(obj => {
                    if (obj.userId === "802982") {
                        obj["appointments"] = extractedData;
                    }
                });
                this.employeeModel.setData(empDate);
            },
            /** Data formulation for shift */
            _convertDataToNewFormat: function(shiftData) {
                const convertedData = shiftData.map(item => {
                    var status = "",
                        color, type;
                    if (item.externalCode === "CLT_0800-1700") {
                        status = "Warning";
                        color = "#ffef9f";
                        type = "Type01";
                    } else {
                        status = "Success";
                        color = "#d1efff";
                        type = "Type06";
                    }
                    return {
                        "externalCode": item.externalCode,
                        "crossMidnightAllowed": item.crossMidnightAllowed,
                        "externalName_defaultValue": item.externalName_defaultValue,
                        "workingHours": item.workingHours,
                        "shiftClassification": item.shiftClassification,
                        "status": status,
                        "color": color,
                        "type": type
                    };
                });

                return convertedData;
            },
            /** Appointment Delails PopOver*/
            handleAppointmentSelect: function(oEvent) {
                var oAppointment = oEvent.getParameter("appointment"),
                    iSelectedAppointments = this.byId("PC1").getSelectedAppointments().length,
                    oView = this.getView();

                if (oAppointment === undefined) {
                    return;
                }
                if (!oAppointment.getSelected() && this._pApptDetailsPopover) {
                    this._pApptDetailsPopover.then(function(oApptDetailsPopover) {
                        oApptDetailsPopover.close();
                    });
                    return;
                }
                oAppointment.setSelected(false)

                if (!this._pApptDetailsPopover) {
                    this._pApptDetailsPopover = Fragment.load({
                        id: oView.getId(),
                        name: "calendar.view.fragments.Appointment",
                        controller: this
                    }).then(function(oApptDetailsPopover) {
                        oView.addDependent(oApptDetailsPopover);
                        return oApptDetailsPopover;
                    });
                }

                this._pApptDetailsPopover.then(function(oApptDetailsPopover) {
                    oApptDetailsPopover.setBindingContext(oAppointment.getBindingContext("employeeModel"));
                    const obj = oAppointment.getBindingContext("employeeModel").getObject();
                    this.apptDetailModel.setData({...obj });
                    oApptDetailsPopover.openBy(oAppointment);
                }.bind(this));
            },
            /** Schedule an appointment !important*/
            handleIntervalSelect: function(oEvent) {
                var oPC = oEvent.getSource(),
                    oStartDate = oEvent.getParameter("startDate"),
                    oRow = oEvent.getParameter("row"),
                    selIntervalDates = [],
                    oTree = this.byId("Tree"),
                    oSelectedItem = oTree.getSelectedItem();
                if (!oSelectedItem) {
                    MessageBox.error("Please select a Shift to assign");
                } else {
                    const selInterval = this.byId("interval"),
                        ifIntervalSel = this.byId("intervalSwitch").getState(),
                        intervalStartDate = selInterval.getDateValue(),
                        intervalEndDate = selInterval.getSecondDateValue();
                    if (intervalStartDate && intervalEndDate && ifIntervalSel) {
                        while (intervalStartDate <= intervalEndDate) {
                            selIntervalDates.push(new Date(intervalStartDate));
                            intervalStartDate.setDate(intervalStartDate.getDate() + 1);
                        }
                    }
                    if (selIntervalDates.length > 0) {
                        selIntervalDates.forEach(date => {
                            oStartDate = date;
                            this._createAppointment(oPC, oRow, oStartDate, oSelectedItem);
                        });
                        this.byId("interval").setDateValue(selIntervalDates[0]);
                        this.byId("interval").setSecondDateValue(selIntervalDates[(selIntervalDates.length) - 1]);
                    } else {
                        this._createAppointment(oPC, oRow, oStartDate, oSelectedItem);
                    }
                }
            },
            _createAppointment: function(oPC, oRow, oStartDate, oSelectedItem) {
                const oMultipleRows = oPC.getSelectedRows(),
                    oModel = this.getView().getModel("employeeModel"),
                    oData = oModel.getData(),
                    oSelectedNode = oSelectedItem.getBindingContext("shiftModel").getObject(),
                    type = oSelectedNode.type,
                    startDate = new Date(new Date(oStartDate).setHours(0, 0, 0, 0)),
                    endDate = new Date(new Date(oStartDate).setHours(23, 59, 59, 999)),
                    oAppointment = {
                        startDate: startDate,
                        endDate: endDate,
                        title: oSelectedNode.externalName_defaultValue,
                        type: type,
                        leave: false,
                        externalCode: oSelectedNode.externalCode,
                        workingHours: oSelectedNode.workingHours,
                        shiftClassification: oSelectedNode.shiftClassification
                    };
                if (oRow || oMultipleRows.length > 0) {
                    const rowsToProcess = oMultipleRows.length > 0 ? oMultipleRows : [oRow];
                    rowsToProcess.forEach(element => {
                        const iIndex = oPC.indexOfRow(element);
                        if (!oData[iIndex].hasOwnProperty('appointments')) {
                            oData[iIndex].appointments = [oAppointment];
                        } else if (!this._ifAppointmentExists(oStartDate, oData[iIndex].appointments)) {
                            oData[iIndex].appointments.push(oAppointment);
                        }
                    });
                } else {
                    const aSelectedRows = oPC.getSelectedRows();
                    aSelectedRows.forEach(selectedRow => {
                        const iIndex = oPC.indexOfRow(selectedRow);
                        if (!oData[iIndex].hasOwnProperty('appointments')) {
                            oData[iIndex].appointments = [oAppointment];
                        } else if (!this._ifAppointmentExists(oStartDate, oData[iIndex].appointments)) {
                            oData[iIndex].appointments.push(oAppointment);
                        }
                    });
                }
                oModel.setData(oData);
            },
            /** Check if appointment already exists*/
            _ifAppointmentExists: function(startDate, appointments) {
                return appointments.some(x => {
                    const date1 = new Date(x.startDate.getFullYear(), x.startDate.getMonth(), x.startDate.getDate()),
                        date2 = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                    return date1 < date2 ? false : date1 > date2 ? false : true;
                });
            },
            /** Validate Special Date */
            _checkIfSpecialDate: function(oEvent) {
                const row = oEvent.getParameter("row");
                if (row) {
                    const oBindingContext = row.getBindingContext("employeeModel"),
                        oObject = oBindingContext.getObject(),
                        oSpecialDates = oObject.specialDates,
                        oSpecialDateLength = oSpecialDates ? oSpecialDates.length : 0,
                        selDate = oEvent.getParameters().startDate;
                    var isSelDateInSpecialDates;
                    if (selDate && oSpecialDateLength > 0) {
                        // Check if selDate exists in the specialDates array
                        isSelDateInSpecialDates = oSpecialDates.some((specialDate) => specialDate.start.toDateString() === selDate.toDateString());
                    }
                }
                if (isSelDateInSpecialDates) {
                    return false;
                } else {
                    return true;
                }
            },
            /** Format Date*/
            formatDate: function(oDate) {
                if (oDate) {
                    var iHours = oDate.getHours(),
                        iMinutes = oDate.getMinutes(),
                        iSeconds = oDate.getSeconds();

                    if (iHours !== 0 || iMinutes !== 0 || iSeconds !== 0) {
                        return DateFormat.getDateTimeInstance({ style: "medium" }).format(oDate);
                    } else {
                        return DateFormat.getDateInstance({ style: "medium" }).format(oDate);
                    }
                }
            },
            /** Employee Deatils PopOver*/
            handleHeaderPress: function(oEvent) {
                const oView = this.getView(),
                    oModel = this.getView().getModel("empDetailModel");;
                this.getCardData(oEvent);

                var oButton = oEvent.getSource();
                this.oMPDialog = this.loadFragment({
                    name: "calendar.view.fragments.Employee",
                });
                this.oMPDialog.then(function(oDialog) {
                    oDialog.setModel(oModel);
                    this.oDialog = oDialog;
                    this.oDialog.open();
                }.bind(this));
            },
            onCloseEmployeeDialog: function() {
                this.oDialog.destroy()
            },
            /** Employee Deatils PopOver*/
            getCardData: function name(oEvent) {
                const oRow = oEvent.getParameters().row,
                    oBindingContext = oRow.getBindingContext("employeeModel"),
                    oObject = {...oBindingContext.getObject() },
                    oProperties = oRow.mProperties;
                const cardData = {
                    "pages": [{
                        "pageId": "employeePageId",
                        "header": "Employee Info",
                        "icon": oProperties.icon,
                        "displayShape": "Circle",
                        "title": oProperties.title,
                        "description": oProperties.text,
                        "groups": [{
                                "heading": "Details",
                                "elements": [{
                                        "label": "Department",
                                        "value": oObject.departmentNav ? oObject.departmentNav.name_defaultValue : ""
                                    },
                                    {
                                        "label": "Position",
                                        "value": oObject.positionNav ? oObject.positionNav.externalName_defaultValue : ""
                                    },
                                    {
                                        "label": "Employee Class",
                                        "value": oObject.employeeClassNav ? oObject.employeeClassNav.picklistLabels.results[0].label : ""
                                    },
                                    {
                                        "label": "Employee Type",
                                        "value": oObject.employmentTypeNav ? oObject.employmentTypeNav.picklistLabels.results[0].label : ""
                                    },
                                    {
                                        "label": "Division",
                                        "value": oObject.divisionNav ? oObject.divisionNav.name_defaultValue : ""
                                    }
                                ]
                            },
                            {
                                "heading": "Company",
                                "elements": [{
                                    "label": "Name",
                                    "value": oObject.companyNav.name_defaultValue
                                }]
                            }
                        ]
                    }]
                }
                this.empDetailModel.setData(cardData);
            },
            /**Change Month name on change */
            onIntervalSelect: function(oEvent) {
                const selState = oEvent.getSource().getState();
                if (selState) {
                    this.byId("interval").setVisible(true);
                    this.byId("intervalTtl").setVisible(true);
                } else {
                    this.byId("interval").setVisible(false);
                    this.byId("intervalTtl").setVisible(false);
                }
            },
            /**Change Start Date --> Month ane */
            onChangeStartDate: function(oEvent) {
                const newStartDate = oEvent.getSource().getStartDate(),
                    year = newStartDate.getFullYear(),
                    monthName = newStartDate.toLocaleString('default', { month: 'long' });
                this.byId("PC1")._oTodayButton.setText(monthName + ' ' + year);
            },
            /**Delete Appointment */
            onDeleteAppointment: function(oEvent) {
                var oDetailsPopover = this.byId("apptDetailsPopover"),
                    oBindingContext = oDetailsPopover.getBindingContext(),
                    oAppointment = oBindingContext.getObject(),
                    iPersonIdStartIndex = oBindingContext.getPath().indexOf("/") + "/".length,
                    iPersonId = oBindingContext.getPath()[iPersonIdStartIndex];
                this._removeAppointment(oAppointment, iPersonId);
                oDetailsPopover.close();
            },
            _removeAppointment: function(oAppointment, sPersonId) {
                var oModel = this.getView().getModel("employeeModel"),
                    sTempPath,
                    aPersonAppointments, iIndexForRemoval;
                if (!sPersonId) {
                    sTempPath = this.sPath.slice(0, this.sPath.indexOf("appointments/") + "appointments/".length);
                } else {
                    sTempPath = "/" + sPersonId + "/appointments";
                }
                aPersonAppointments = oModel.getProperty(sTempPath);
                iIndexForRemoval = aPersonAppointments.indexOf(oAppointment);
                if (iIndexForRemoval !== -1) {
                    aPersonAppointments.splice(iIndexForRemoval, 1);
                }
                oModel.setProperty(sTempPath, aPersonAppointments);
            },
            /**Clear Shift Selection  */
            // onClearSelection: function() {
            //     this.byId("Tree").removeSelections();
            // }
        });
    });