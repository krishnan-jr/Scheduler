service SyncService @(path: '/sync') {
    function syncShifts() returns String;
    function syncEmployees() returns String;
    function syncHolidays() returns String;
    function syncLeaves() returns String;
}
