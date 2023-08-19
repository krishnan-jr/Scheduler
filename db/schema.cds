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
