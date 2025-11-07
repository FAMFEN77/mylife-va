docker exec -it mylifeva-db-1 psql -U postgres -d mylife_va

docker exec -it mylifeva-db-1 psql -U postgres -d mylife_va -c \
"INSERT INTO \"Organisation\" (id, name, plan, \"createdAt\", \"updatedAt\") VALUES ('org1', 'Taskee Zorgteam', 'PRO', NOW(), NOW());"

docker exec -it mylifeva-db-1 psql -U postgres -d mylife_va -c 'SELECT id FROM "User" WHERE email = '\''rfenanlamber@gmail.com'\'';'

docker exec -it mylifeva-db-1 psql -U postgres -d mylife_va -c \
"UPDATE \"User\" SET \"organisationId\"='org1' WHERE email='rfenanlamber@gmail.com';"


----------------------------

PS D:\Taskee> docker exec -it mylifeva-backend-1 sh -c "npx prisma db seed"
