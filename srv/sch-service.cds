using {ColorCode} from '../db/schema';

service ScheduleService @(path: '/schedule') {
    @readonly
    entity ColorCodes as projection on ColorCode;
}
