service SyncService @(path: '/sync') {
    function syncShifts() returns String;
    function syncJobs() returns String;
    function syncHolidays() returns String;
}
