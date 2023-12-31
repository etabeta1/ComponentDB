require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3');
const fs = require('fs');
const { exit } = require('process');
var morgan = require('morgan')

const HTTP_PORT = process.env.HTTP_PORT || 3000;
const DB_PATH = process.env.DB_PATH || "./database.db";

const app = express();
app.use(express.json());

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

const apiRouter = express.Router();
apiRouter.use(express.json());
apiRouter.use(morgan('dev'));

const db = new sqlite3.Database(DB_PATH, (err) => {
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
            db.run(sql, [req.body.MPN.trim(), req.body.Description.trim(), req.body.Manufacturer.trim(), req.body.Datasheet.trim(), row.Id, req.body.Amount], (err) => {
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

    db.get("SELECT Id FROM Storage WHERE Id = ?;", [req.body.Storage], (err, row) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            const sql = "UPDATE Parts SET MPN = ?, Description = ?, Manufacturer = ?, Datasheet = ?, StorageId = ?, Amount = ? WHERE Id = ?;";
            db.run(sql, [req.body.MPN.trim(), req.body.Description.trim(), req.body.Manufacturer.trim(), req.body.Datasheet.trim(), row.Id, req.body.Amount, req.params.id], (err) => {
                if (err) {
                    res.status(500).send(err.message);
                } else {
                    res.sendStatus(200);
                }
            });
        }
    });
});

apiRouter.delete('/parts/:id', (req, res) => {
    db.get("SELECT Amount FROM Parts WHERE Id = ?;", [req.params.id], (err, row) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            if (row.Amount > 0) {
                res.status(400).send("Part has still parts in stock");
                return;
            }

            const sql = "DELETE FROM Parts WHERE Id = ?;";
            db.run(sql, [req.params.id], (err) => {
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
    const sql = "SELECT Storage.Id, Storage.Name, Storage.Description, COUNT(Parts.Id) AS Unique_parts, IFNULL(SUM(Parts.Amount), 0) AS Part_count FROM Storage LEFT JOIN Parts ON Parts.StorageId = Storage.Id GROUP BY Storage.Id;";

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

apiRouter.get('/storages/:id', (req, res) => {
    const sql = "SELECT Id, Name, Description FROM Storage WHERE Id = ?;";
    db.get(sql, [req.params.id], (err, row) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            res.json(row);
        }
    });
});

apiRouter.post('/storages', (req, res) => {
    if (!req.body.Name) {
        res.status(400).send("Name is required");
        return;
    }

    if (!req.body.Begin_number) {
        res.status(400).send("Begin number is required");
        return;
    }

    if (!req.body.End_number) {
        res.status(400).send("End number is required");
        return;
    }

    if (req.body.Begin_number > req.body.End_number) {
        res.status(400).send("Begin number must be smaller than end number");
        return;
    }

    let sql = "INSERT INTO Storage (Name, Description) VALUES " + Array(req.body.End_number - req.body.Begin_number + 1).fill("(?, ?)").join(", ") + ";";
    let args = [];

    for (let i = req.body.Begin_number; i <= req.body.End_number; i++) {
        args.push(req.body.Name.trim() + "-" + i);
        args.push(req.body.Description.trim());
    }

    db.run(sql, args, (err) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            res.sendStatus(200);
        }
    });
});

apiRouter.put("/storages/:id", (req, res) => {
    if (!req.body.Description) {
        res.status(400).send("Description is required");
        return;
    }

    const sql = "UPDATE Storage SET Description = ? WHERE Id = ?;";

    db.run(sql, [req.body.Description.trim(), req.params.id], (err) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            res.sendStatus(200);
        }
    });
});

apiRouter.delete("/storages/:id", (req, res) => {
    db.get("SELECT Id FROM Parts WHERE StorageId = ?;", [req.params.id], (err, row) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            if (row) {
                res.status(400).send("Storage is not empty");
                return;
            }

            const sql = "DELETE FROM Storage WHERE Id = ?;";
            db.run(sql, [req.params.id], (err) => {
                if (err) {
                    res.status(500).send(err.message);
                } else {
                    res.sendStatus(200);
                }
            });
        }
    });
});

apiRouter.post("/storages/:id/dumpInto/", (req, res) => {
    console.log(req.body);

    if (!req.body.Id) {
        res.status(400).send("Id is required");
        return;
    }

    const sql = "UPDATE Parts SET StorageId = ? WHERE StorageId = ?;";
    db.run(sql, [req.body.Storage, req.params.id], (err) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            res.sendStatus(200);
        }
    });
});

app.listen(HTTP_PORT, () => {
    console.log('Server started on http://localhost:' + HTTP_PORT);
});