CREATE TABLE IF NOT EXISTS Storage (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Name Text NOT NULL UNIQUE,
    Description TEXT
);

INSERT OR IGNORE INTO Storage (Id, Name, Description) VALUES (0, 'Somewhere else', 'The default storage location for parts that are not stored anywhere.');

CREATE TABLE IF NOT EXISTS Parts (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    MPN TEXT NOT NULL,
    Description TEXT,
    Manufacturer TEXT,
    Datasheet TEXT,
    StorageId INTEGER NOT NULL,
    Amount INTEGER NOT NULL CHECK(Amount >= 0) DEFAULT 0,

    FOREIGN KEY(StorageId) REFERENCES Storage(Id),
    UNIQUE(MPN, Manufacturer)
);

