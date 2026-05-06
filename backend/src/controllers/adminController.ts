
import { Request, Response } from 'express';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execPromise = promisify(exec);
const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export const createBackup = async (req: Request, res: Response) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.dump`;
    const filepath = path.join(BACKUP_DIR, filename);

    // Extract connection info from environment or DATABASE_URL
    // Example: postgresql://user:pass@host:port/db
    const dbUrl = process.env.DATABASE_URL || '';
    
    // We use pg_dump with custom format (-Fc) which is better for pg_restore
    // Note: PGPASSWORD can be used to provide password without prompt
    const password = process.env.DB_PASSWORD || 'palm_pass';
    const user = process.env.DB_USER || 'palm_admin';
    const dbName = process.env.DB_NAME || 'palm_ops_db';
    const host = 'db'; // Internal docker host
    const port = '5432';

    const command = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${user} -F c -b -v -f "${filepath}" ${dbName}`;

    console.log(`Executing backup: ${filename}`);
    await execPromise(command);

    res.json({
      message: 'Backup created successfully',
      filename,
      size: fs.statSync(filepath).size
    });
  } catch (error: any) {
    console.error('Backup error:', error);
    res.status(500).json({ message: 'Failed to create backup', error: error.message });
  }
};

export const listBackups = async (req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.endsWith('.dump'))
      .map(file => {
        const stats = fs.statSync(path.join(BACKUP_DIR, file));
        return {
          filename: file,
          size: stats.size,
          createdAt: stats.birthtime
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    res.json(files);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to list backups', error: error.message });
  }
};

export const restoreBackup = async (req: Request, res: Response) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ message: 'Filename is required' });
    }

    const filepath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ message: 'Backup file not found' });
    }

    const password = process.env.DB_PASSWORD || 'palm_pass';
    const user = process.env.DB_USER || 'palm_admin';
    const dbName = process.env.DB_NAME || 'palm_ops_db';
    const host = 'db';
    const port = '5432';

    // To restore, we might need to terminate existing connections if we were dropping the DB,
    // but here we just use pg_restore with --clean --if-exists.
    // However, a more robust way is to use --clean
    const command = `PGPASSWORD="${password}" pg_restore -h ${host} -p ${port} -U ${user} -d ${dbName} --clean --if-exists --no-owner "${filepath}"`;

    console.log(`Executing restore: ${filename}`);
    await execPromise(command);

    res.json({ message: 'Database restored successfully' });
  } catch (error: any) {
    console.error('Restore error:', error);
    res.status(500).json({ message: 'Failed to restore database', error: error.message });
  }
};

export const deleteBackup = async (req: Request, res: Response) => {
  try {
    const filename = req.params.filename as string;
    const filepath = path.join(BACKUP_DIR, filename);

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      res.json({ message: 'Backup deleted successfully' });
    } else {
      res.status(404).json({ message: 'File not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete backup', error: error.message });
  }
};

export const downloadBackup = async (req: Request, res: Response) => {
  try {
    const filename = req.params.filename as string;
    const filepath = path.join(BACKUP_DIR, filename);

    if (fs.existsSync(filepath)) {
      res.download(filepath);
    } else {
      res.status(404).json({ message: 'File not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to download backup', error: error.message });
  }
};
