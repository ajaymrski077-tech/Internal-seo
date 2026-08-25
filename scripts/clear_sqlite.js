const Database = require('better-sqlite3');
const db = new Database('dev.db');

console.log("Clearing data...");
db.exec('DELETE FROM AnalyticsSnapshot');
db.exec('DELETE FROM ReportSnapshot');
db.exec('DELETE FROM Report');
db.exec("UPDATE IntegrationConnection SET status='DISCONNECTED', syncStatus=NULL, syncError=NULL, accessToken=NULL, refreshToken=NULL");
console.log("Done!");
db.close();
