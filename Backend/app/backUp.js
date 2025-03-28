/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */

const { Client } = require('pg');
const s3 = require('../utils/s3bucket');
const BackupLog = require('./backupLog');
const ExcelJS = require('exceljs');

const DBPASSWORD = process.env.DB_PASSWORD
const DBUSERNAME = process.env.USER_NAME
const DBNAME = process.env.DB_NAME
const DBHOST = process.env.DB_HOST
async function backup() {
    const client = new Client({
        user: DBUSERNAME,
        host: DBHOST,
        database: DBNAME,
        password: DBPASSWORD,
        port: 5432,
    });
  
    try {
        await client.connect();
  
        const res = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
        `);
  
        for (const row of res.rows) {
            const tableName = row.table_name;
  
            try {
                const query = `SELECT * FROM "${tableName}"`;
                const tableData = await client.query(query);
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet(tableName);

                // Add column headers
                const columns = Object.keys(tableData.rows[0]).map((col) => ({ header: col, key: col }));
                worksheet.columns = columns;

                // Add rows
                tableData.rows.forEach((row) => {
                    worksheet.addRow(row);
                });

                // Save to buffer
                const buffer = await workbook.xlsx.writeBuffer();
                // const jsonData = JSON.stringify(tableData.rows, null, 2);
                const formattedDate = new Date().toISOString().split('T')[0];
                const filename = `backup/${formattedDate}/backup-${tableName}.xlsx`;
                const params = {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: filename, 
                    Body: buffer,
                    ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    ACL: 'public-read' 
                  };
  
                const data = await s3.upload(params).promise();
  
                const fileUrl = data.Location ? data.Location : '';
  
                const backUpLog = new BackupLog({tableName, backUpTime: new Date(), url: fileUrl});
                await backUpLog.save();
  
            } catch (tableErr) {
                console.error(`Failed to back up table: ${tableName}`, tableErr.message);
            }
        }
    } catch (err) {
        console.error('Error during backup:', err.message);
    } finally {
        await client.end();
        console.log("Backup process completed.");
    }
}

module.exports = backup;