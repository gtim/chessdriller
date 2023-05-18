#!/bin/bash
# back up the dev database

db_fn="prisma/dev.db"
backup_dir="backup"
backup_fn="dev_$(date +"%Y%m%d%H%M%S").db.bak"

if [ ! -d "$backup_dir" ]; then
	mkdir "$backup_dir"
fi

if [ ! -f "$db_fn" ]; then
	echo "database file $db_fn not found!"
	exit 1
fi

sqlite3 "$db_fn" ".backup $backup_dir/$backup_fn"
