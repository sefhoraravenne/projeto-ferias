import * as bcrypt from 'bcrypt';

export class HashUtil {
  private static readonly SALT_ROUNDS = 10;

  /**
   * Verifica se uma string é um hash bcrypt válido
   * Bcrypt hashes começam com $2a$, $2b$, ou $2y$ seguido de um número e um $
   */
  static isBcryptHash(str: string): boolean {
    return /^\$2[ayb]\$\d{2}\$/.test(str);
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compara senha fornecida com a senha armazenada
   * Suporta tanto senhas em texto plano (legado) quanto hashes bcrypt
   * Se a senha armazenada for texto plano e a comparação for bem-sucedida,
   * retorna true para permitir login e migração posterior
   */
  static async comparePassword(password: string, storedPassword: string): Promise<boolean> {
    // Se a senha armazenada é um hash bcrypt, usar bcrypt.compare
    if (this.isBcryptHash(storedPassword)) {
      return bcrypt.compare(password, storedPassword);
    }
    
    // Se não é hash, comparar diretamente (senha antiga em texto plano)
    return password === storedPassword;
  }
}

