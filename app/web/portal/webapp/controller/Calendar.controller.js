sap.ui.define([
    "sap/ui/core/library",
    "sap/ui/core/Fragment",
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/format/DateFormat",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
],
    function (library,
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
            onBeforeRendering: function () {
                this.byId("container-calendar---Calendar--PC1-Header-NavToolbar-PickerBtn").setVisible(false);
                const newStartDate = this.byId("PC1").getStartDate(),
                    year = newStartDate.getFullYear(),
                    monthName = newStartDate.toLocaleString('default', { month: 'long' });
                this.byId("PC1")._oTodayButton.setText(monthName + ' ' + year);
            },
            /**
             * @override
             */
            onAfterRendering: function () {
            },
            onInit: function () {
                this.shiftModel = new JSONModel();
                this.getView().setModel(this.shiftModel, "shiftModel");

                this.employeeModel = new JSONModel();
                this.getView().setModel(this.employeeModel, "employeeModel");

                this.apptDetailModel = new JSONModel();
                this.getView().setModel(this.apptDetailModel, "apptDetailModel");

                this.empDetailModel = new JSONModel();
                this.getView().setModel(this.empDetailModel, "empDetailModel");
                sap.ui.core.BusyIndicator.show();
                this._getShiftData();
                this._getEmployeeData();
            },
            _getShiftData: function () {
                var _self = this;

            },
            _getEmployeeData: function () {
                var _self = this;
                jQuery.ajax({
                    url: "/srv/schedule/Employees?$filter=managerId eq '802981'&$expand=appointments",
                    type: "GET",
                    success: function (data, status, xhr) {
                        if (data.value.length > 0) {

                            // Function to set time to start of day (00:00:00)
                            function setStartOfDay(date) {
                                const startOfDay = new Date(date);
                                startOfDay.setHours(0, 0, 0, 0);
                                return startOfDay;
                            }

                            // Function to set time to end of day (23:59:59)
                            function setEndOfDay(date) {
                                const endOfDay = new Date(date);
                                endOfDay.setHours(23, 59, 59, 999);
                                return endOfDay;
                            }

                            // Loop through the main array
                            for (const item of data.value) {
                                // Loop through the appointments array within each element
                                for (const appointment of item.appointments) {
                                    // Convert date strings to Date format
                                    appointment.startDate = setStartOfDay(appointment.startDate);
                                    appointment.endDate = setEndOfDay(appointment.endDate);
                                }
                            }
                        }
                        jQuery.ajax({
                            url: "/srv/schedule/Shift",
                            type: "GET",
                            success: function (data, status, xhr) {
                                _self.shiftModel.setData(data.value);
                                sap.ui.core.BusyIndicator.hide()
                            },
                            error: function (response) {
                                sap.ui.core.BusyIndicator.hide()
                            }
                        });
                        _self.employeeModel.setData(data.value);
                    },
                    error: function (response) {
                        sap.ui.core.BusyIndicator.hide()
                    }
                });
            },
            /** Appointment Delails PopOver*/
            handleAppointmentSelect: function (oEvent) {
                var oAppointment = oEvent.getParameter("appointment"),
                    iSelectedAppointments = this.byId("PC1").getSelectedAppointments().length,
                    oView = this.getView();

                if (oAppointment === undefined) {
                    return;
                }
                if (!oAppointment.getSelected() && this._pApptDetailsPopover) {
                    this._pApptDetailsPopover.then(function (oApptDetailsPopover) {
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
                    }).then(function (oApptDetailsPopover) {
                        oView.addDependent(oApptDetailsPopover);
                        return oApptDetailsPopover;
                    });
                }

                this._pApptDetailsPopover.then(function (oApptDetailsPopover) {
                    oApptDetailsPopover.setBindingContext(oAppointment.getBindingContext("employeeModel"));
                    const obj = oAppointment.getBindingContext("employeeModel").getObject();
                    this.apptDetailModel.setData({ ...obj });
                    oApptDetailsPopover.openBy(oAppointment);
                }.bind(this));
            },
            /** Schedule an appointment !important*/
            handleIntervalSelect: function (oEvent) {
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
            _createAppointment: function (oPC, oRow, oStartDate, oSelectedItem) {
                const oMultipleRows = oPC.getSelectedRows(),
                    oModel = this.getView().getModel("employeeModel"),
                    oData = oModel.getData(),
                    oSelectedNode = oSelectedItem.getBindingContext("shiftModel").getObject(),
                    colorType = oSelectedNode.colorType,
                    startDate = new Date(new Date(oStartDate).setHours(0, 0, 0, 0)),
                    endDate = new Date(new Date(oStartDate).setHours(23, 59, 59, 999)),
                    oAppointment = {
                        startDate: startDate,
                        endDate: endDate,
                        title: oSelectedNode.externalName_defaultValue,
                        colorType: colorType,
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
            _ifAppointmentExists: function (startDate, appointments) {
                return appointments.some(x => {
                    const date1 = new Date(x.startDate.getFullYear(), x.startDate.getMonth(), x.startDate.getDate()),
                        date2 = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                    return date1 < date2 ? false : date1 > date2 ? false : true;
                });
            },
            /** Validate Special Date */
            _checkIfSpecialDate: function (oEvent) {
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
            formatDate: function (oDate) {
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
            handleHeaderPress: function (oEvent) {
                const oView = this.getView(),
                    oModel = this.getView().getModel("empDetailModel");;
                this.getCardData(oEvent);

                var oButton = oEvent.getSource();
                this.oMPDialog = this.loadFragment({
                    name: "calendar.view.fragments.Employee",
                });
                this.oMPDialog.then(function (oDialog) {
                    oDialog.setModel(oModel);
                    this.oDialog = oDialog;
                    this.oDialog.open();
                }.bind(this));
            },
            onCloseEmployeeDialog: function () {
                this.oDialog.destroy()
            },
            /** Employee Deatils PopOver*/
            getCardData: function name(oEvent) {
                const oRow = oEvent.getParameters().row,
                    oBindingContext = oRow.getBindingContext("employeeModel"),
                    oObject = { ...oBindingContext.getObject() },
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
                                "value": oObject.departmentName ?? ""
                            },
                            {
                                "label": "Position",
                                "value": oObject.positionName ?? ""
                            },
                            {
                                "label": "Employee Class",
                                "value": oObject.employeeClassName ?? ""
                            },
                            {
                                "label": "Employee Type",
                                "value": oObject.employmentTypeName ?? ""
                            },
                            {
                                "label": "Division",
                                "value": oObject.divisionName ?? ""
                            }
                            ]
                        },
                        {
                            "heading": "Company",
                            "elements": [{
                                "label": "Name",
                                "value": oObject.companyName ?? ""
                            }]
                        }
                        ]
                    }]
                }
                this.empDetailModel.setData(cardData);
            },
            /**Change Month name on change */
            onIntervalSelect: function (oEvent) {
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
            onChangeStartDate: function (oEvent) {
                const newStartDate = oEvent.getSource().getStartDate(),
                    year = newStartDate.getFullYear(),
                    monthName = newStartDate.toLocaleString('default', { month: 'long' });
                this.byId("PC1")._oTodayButton.setText(monthName + ' ' + year);
            },
            /**Delete Appointment */
            onDeleteAppointment: function (oEvent) {
                var oDetailsPopover = this.byId("apptDetailsPopover"),
                    oBindingContext = oDetailsPopover.getBindingContext(),
                    oAppointment = oBindingContext.getObject(),
                    iPersonIdStartIndex = oBindingContext.getPath().indexOf("/") + "/".length,
                    iPersonId = oBindingContext.getPath()[iPersonIdStartIndex];
                this._removeAppointment(oAppointment, iPersonId);
                oDetailsPopover.close();
            },
            _removeAppointment: function (oAppointment, sPersonId) {
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
            onClearSelection: function () {
                this.byId("Tree").removeSelections();
            }
        });
    });