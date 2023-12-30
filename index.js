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

// Endpoint to get all parts
apiRouter.get('/parts', (req, res) => {
    const sql = "SELECT p.Id, p.MPN, p.Description, p.Manufacturer, p.Datasheet, s.Name as Location, p.amount FROM parts p LEFT JOIN Storage s ON p.StorageId = s.Id;";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            res.json({
                headers: ["ID", "MPN", "Description", "Manufacturer", "Datasheet", "Location", "Amount", "Edit"].map((h) => { return { name: h } }),
                rows: rows,
            });
        }
    });
});

// Endpoint to get a single part
apiRouter.get('/parts/:id', (req, res) => {
    const sql = "SELECT p.Id, p.MPN, p.Description, p.Manufacturer, p.Datasheet, s.Name, p.amount FROM parts p LEFT JOIN Storage s ON p.StorageId = s.Id WHERE p.Id = ?;";
    db.get(sql, [req.params.id], (err, row) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            res.json(row);
        }
    });
});

// Endpoint to create a new part
apiRouter.post('/parts', (req, res) => {
    if (!req.body.MPN) {
        res.status(400).send("MPN is required");
        return;
    }

    if (!req.body.Storage) {
        res.status(400).send("Storage is required");
        return;
    }

    if (!req.body.Amount) {
        res.status(400).send("Amount is required");
        return;
    }

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

// Endpoint to update an existing part
apiRouter.put('/parts/:id', (req, res) => {
    if (!req.body.MPN) {
        res.status(400).send("MPN is required");
        return;
    }

    if (!req.body.Storage) {
        res.status(400).send("Storage is required");
        return;
    }

    if (!req.body.Amount) {
        res.status(400).send("Amount is required");
        return;
    }

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
    const sql = "SELECT Storage.Id, Storage.Name, Storage.Description, SUM(Parts.Amount) AS Part_count FROM Storage LEFT JOIN Parts ON Parts.StorageId = Storage.Id GROUP BY Storage.Id;";

    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            res.json({
                rows: rows,
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