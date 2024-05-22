\c postgres
DROP DATABASE IF EXISTS "application-image";
CREATE DATABASE "application-image";
\c application-image
DROP TABLE IF EXISTS accounts_image_like;
DROP TABLE IF EXISTS commentaires;
DROP TABLE IF EXISTS images;
DROP TABLE IF EXISTS orientations;
DROP TABLE IF EXISTS auteurs;

CREATE TABLE auteurs(
    id SERIAL PRIMARY KEY,
    prenom VARCHAR(30),
    nom VARCHAR(30)
);
--INSERT INTO auteurs (prenom,nom) VALUES ('Marcel','Duchamp'),('Elisa','Von Gloeden');

CREATE TABLE orientations(
    id_orientation SERIAL PRIMARY KEY,
    orientation VARCHAR(8)
);
INSERT INTO orientations (orientation) VALUES ('portrait'),('paysage');
--un nom de fichier, des likes. Elle est créée par un auteur

CREATE TABLE images(
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100),
    date DATE,
    orientation INT REFERENCES orientations(id_orientation),
    fichier VARCHAR(50),
    likes INT,
    id_auteur INT REFERENCES auteurs(id) 
);

CREATE TABLE commentaires(
    id_image INT REFERENCES images(id),
    texte VARCHAR(100)
);

CREATE TABLE accounts(
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    salt BYTEA,
    hash BYTEA
);

CREATE TABLE accounts_image_like(
    username VARCHAR(100) REFERENCES accounts(username),
    id_image INT REFERENCES images(id)
);