>>>cd "C:/Program Files/PostgreSQL/16/bin"
>>>./pg_ctl start -D "C:/Program Files/PostgreSQL/16/data"
>>>./psql -U postgres -W
postgres=# \i ../data/InitMyDB/application-image.sql
postgres=# \i ../data/InitMyDB/auteurs.sql
postgres=# \i ../data/InitMyDB/images.sql
postgres=# \q
>>>pg_ctl stop -D "C:/Program Files/PostgreSQL/16/data"
