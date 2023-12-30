CREATE TABLE IF NOT EXISTS Storage (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Name Text NOT NULL UNIQUE,
    Description TEXT
);

-- INSERT INTO Storage (Name, Description) VALUES ('Somewhere else', 'The default storage location for parts that are not stored anywhere.');

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

-- INSERT INTO Storage (Name, Description) VALUES ('Default', 'Default storage');
-- INSERT INTO Parts (MPN, Description, Datasheet, StorageId, Amount) VALUES ('123', 'Test part', 'http://example.com', 1, 10);
