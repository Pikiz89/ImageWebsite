# instructions Winsdows 10
// se déplacer dans le répertoire ou on à installer postgres\n
cd "C:/Program Files/PostgreSQL/16/bin"\n
// démarrer la BD\n
./pg_ctl start -D "C:/Program Files/PostgreSQL/16/data"\n
// rentrer dans le client postgres\n
./psql -U postgres -W\n
//une fois dans le client :\n
//j'execute ça pour remplir la BD
postgres=# \i ../data/InitMyDB/application-image.sql
postgres=# \i ../data/InitMyDB/auteurs.sql
postgres=# \i ../data/InitMyDB/images.sql
// on quitte 'proprement'
postgres=# \q
// on arrête la BD
./pg_ctl stop -D "C:/Program Files/PostgreSQL/16/data"
