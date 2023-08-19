using {
    ColorCode,
    Shifts,
    Segments
} from '../db/schema';

service ScheduleService @(path: '/schedule') {
    @readonly
    entity ColorCodes as projection on ColorCode;
    entity Shift      as projection on Shifts;
    entity Segment     as projection on Segments;
}
