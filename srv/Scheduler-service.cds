using {
                    ColorCode,
                    Shifts,
                    Segments,
    Employees    as employees,
    Holidays     as holidays,
    Appointments as appointments
} from '../db/schema';

service ScheduleService @(path: '/schedule') {
    entity ColorCodes   as projection on ColorCode;
    entity Shift        as projection on Shifts;
    entity Segment      as projection on Segments;
    entity Employees    as projection on employees;
    entity Holidays     as projection on holidays;
    entity Appointments as projection on appointments;
}
