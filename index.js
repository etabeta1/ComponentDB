const express = require('express');
const sqlite3 = require('sqlite3');
const fs = require('fs');
const { exit } = require('process');


const app = express();
app.use(express.json());

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

const apiRouter = express.Router();
apiRouter.use(express.json());

const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error("Error opening database " + err.message);
        exit(1);
    } else {
        const dataSql = fs.readFileSync("./tables.sql").toString();
        db.exec(dataSql, (err) => {
            if (err) {
                console.error("Error creating tables " + err.message);
                exit(1);
            }
        });
    }
});

app.use('/static', express.static(__dirname + '/static'));
app.use('/api', apiRouter);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

apiRouter.get('/parts', (req, res) => {
    const sql = "SELECT p.Id, p.MPN, p.Description, p.Manufacturer, p.Datasheet, s.Name, p.amount FROM parts p LEFT JOIN Storage s ON p.StorageId = s.Id;";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            console.log(rows);
            res.json({
                headers: ["ID", "MPN", "Description", "Manufacturer", "Datasheet", "Location", "Amount", "Edit"].map((h) => { return { name: h } }),
                rows: rows.map((r) => {
                    return { cells: [r.Id, r.MPN, r.Description, r.Manufacturer, r.Datasheet, r.Name, r.Amount], editable: true, new: false };
                }),
            });
        }
    });
});

apiRouter.get('/parts/:id', (req, res) => {
    const sql = "SELECT p.Id, p.MPN, p.Description, p.Manufacturer, p.Datasheet, s.Name, p.amount FROM parts p LEFT JOIN Storage s ON p.StorageId = s.Id WHERE p.Id = ?;";
    db.get(sql, [req.params.id], (err, row) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            console.log(row);
        }
    });
});

apiRouter.post('/parts', (req, res) => {
    db.get("SELECT Id FROM Storage WHERE Name = ?;", [req.body.Storage], (err, row) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            const sql = "INSERT INTO Parts (MPN, Description, Manufacturer, Datasheet, StorageId, Amount) VALUES (?, ?, ?, ?, ?, ?);";
            db.run(sql, [req.body.MPN, req.body.Description, req.body.Manufacturer, req.body.Datasheet, row.Id, req.body.Amount], (err) => {
                if (err) {
                    res.status(500).send(err.message);
                } else {
                    res.sendStatus(200);
                }
            });
        }
    });
});

apiRouter.put('/parts/:id', (req, res) => {
    db.get("SELECT Id FROM Storage WHERE Name = ?;", [req.body.Storage], (err, row) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            const sql = "UPDATE Parts SET MPN = ?, Description = ?, Manufacturer = ?, Datasheet = ?, StorageId = ?, Amount = ? WHERE Id = ?;";
            db.run(sql, [req.body.MPN, req.body.Description, req.body.Manufacturer, req.body.Datasheet, row.Id, req.body.Amount, req.params.id], (err) => {
                if (err) {
                    res.status(500).send(err.message);
                } else {
                    res.sendStatus(200);
                }
            });
        }
    });
});

apiRouter.get('/storages', (req, res) => {
    const sql = "SELECT * FROM Storage;";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            res.json({
                headers: ["ID", "Name", "Edit"].map((h) => { return { name: h } }),
                rows: rows.map((r) => {
                    return { cells: [r.Id, r.Name], editable: false }
                }),
            });
        }
    });
});

apiRouter.get("/storage_names", (req, res) => {
    const sql = "SELECT Name FROM Storage;";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            res.json({ names: rows.map((r) => r.Name) });
        }
    });
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});