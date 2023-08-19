using {
                      ColorCode,
                      Shifts,
                      Segments,
    Jobs           as jobs
} from '../db/schema';

service ScheduleService @(path: '/schedule') {
    entity ColorCodes     as projection on ColorCode;
    entity Shift          as projection on Shifts;
    entity Segment        as projection on Segments;
    entity Jobs           as projection on jobs;
}
