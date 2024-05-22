# instructions Winsdows 10
// se déplacer dans le répertoire ou on à installer postgres
cd "C:/Program Files/PostgreSQL/16/bin"
// démarrer la BD
./pg_ctl start -D "C:/Program Files/PostgreSQL/16/data"
// rentrer dans le client postgres
./psql -U postgres -W
//une fois dans le client :
//j'execute ça pour remplir la BD
postgres=# \i ../data/InitMyDB/application-image.sql
postgres=# \i ../data/InitMyDB/auteurs.sql
postgres=# \i ../data/InitMyDB/images.sql
postgres=# \q
>>>pg_ctl stop -D "C:/Program Files/PostgreSQL/16/data"
