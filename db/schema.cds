using {managed} from '@sap/cds/common';

entity ColorCode {
    key colorType : String(10);
        colorCode : String(7);
}

entity ShiftDefinition {
    key customerId : Integer;
    key shiftId    : String(50);
        colorType  : type of ColorCode : colorType;
        color      : Association to ColorCode
                         on color.colorType = colorType;
}

entity DraftMaster : managed {
    key customerId   : Integer;
    key employee     : Integer;
    key month        : Integer;
    key year         : Integer;
    key assignmentId : Integer;
        status       : String(10);
}

entity DraftItems {
    key AssignmentId : Integer;
        ![1]         : String(50);
        ![2]         : String(50);
        ![3]         : String(50);
        ![4]         : String(50);
        ![5]         : String(50);
        ![6]         : String(50);
        ![7]         : String(50);
        ![8]         : String(50);
        ![9]         : String(50);
        ![10]        : String(50);
        ![11]        : String(50);
        ![12]        : String(50);
        ![13]        : String(50);
        ![14]        : String(50);
        ![15]        : String(50);
        ![16]        : String(50);
        ![17]        : String(50);
        ![18]        : String(50);
        ![19]        : String(50);
        ![20]        : String(50);
        ![21]        : String(50);
        ![22]        : String(50);
        ![23]        : String(50);
        ![24]        : String(50);
        ![25]        : String(50);
        ![26]        : String(50);
        ![27]        : String(50);
        ![28]        : String(50);
        ![29]        : String(50);
        ![30]        : String(50);
        ![31]        : String(50);


}

entity Shifts {
    key externalCode              : String(128);
        externalName_defaultValue : String(255) default '';
        crossMidnightAllowed      : Boolean default false;
        workingHours              : Decimal default 0;
        timeRecordingVariant      : String(255) default '';
        shiftClassification       : String(128) default '';
        Segments                  : Association to many Segments
                                        on Segments.WorkScheduleDayModel = $self;
        colorType                 : type of ColorCode : colorType;
        colorCode                 : type of ColorCode : colorCode;
}

entity Segments {
    key WorkScheduleDayModel : Association to Shifts;
    key externalCode         : String(128);
        startTime            : String(13) default '';
        endTime              : String(13) default '';
        duration             : Integer default 0;
        category             : String(255) default '';
}

entity Jobs {
    key userId              : String(100);
    key seqNumber           : Integer;
    key startDate           : DateTime;
        employeeClass       : String(256);
        businessUnit        : String(32);
        employmentType      : String(32);
        costCenter          : String(32);
        managerId           : String(256);
        division            : String(32);
        company             : String(32);
        location            : String(128);
        position            : String(128);
        department          : String(32);
        employmentTypeName  : String(256);
        businessUnitName    : String(256);
        locationName        : String(256);
        positionName        : String(256);
        departmentName      : String(256);
        divisionName        : String(256);
        costCenterName      : String(256);
        companyName         : String(256);
        employeeClassName   : String(256);
        employmentStartDate : DateTime;
        employmentEndDate   : DateTime;
        firstName           : String(128);
        lastName            : String(128);
        photo               : LargeString;
        mimeType            : String(32);
}

