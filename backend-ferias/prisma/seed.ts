import { PrismaClient, Tipo } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Setores
  const rh = await prisma.setor.upsert({
    where: { nome: 'RH' },
    update: {},
    create: { nome: 'RH' },
  });
  const ti = await prisma.setor.upsert({
    where: { nome: 'TI' },
    update: {},
    create: { nome: 'TI' },
  });
  const financeiro = await prisma.setor.upsert({
    where: { nome: 'Financeiro' },
    update: {},
    create: { nome: 'Financeiro' },
  });
  const comercial = await prisma.setor.upsert({
    where: { nome: 'Comercial' },
    update: {},
    create: { nome: 'Comercial' },
  });

  // Cargos
  const cargoGestor = await prisma.cargo.upsert({
    where: { nome: 'Gestor' },
    update: {},
    create: { nome: 'Gestor' },
  });
  const cargoDev = await prisma.cargo.upsert({
    where: { nome: 'Desenvolvedor' },
    update: {},
    create: { nome: 'Desenvolvedor' },
  });
  const cargoAnalista = await prisma.cargo.upsert({
    where: { nome: 'Analista' },
    update: {},
    create: { nome: 'Analista' },
  });
  const cargoRh = await prisma.cargo.upsert({
    where: { nome: 'RH' },
    update: {},
    create: { nome: 'RH' },
  });

  // Usuário RH
  const mariaRh = await prisma.user.upsert({
    where: { email: 'maria.rh@empresa.com' },
    update: {},
    create: {
      nome: 'Maria Souza',
      email: 'maria.rh@empresa.com',
      senha: 'rh123', // SEM HASH
      cpf: '11122233344',
      idade: 35,
      salario: 8000,
      tipo: Tipo.RH,
      setorId: rh.id,
      cargoId: cargoRh.id,
    },
  });

  // Gestores
  const joaoGestor = await prisma.user.upsert({
    where: { email: 'joao.gestor@empresa.com' },
    update: {},
    create: {
      nome: 'João Silva',
      email: 'joao.gestor@empresa.com',
      senha: 'gestor123',
      cpf: '55566677788',
      idade: 40,
      salario: 10000,
      tipo: Tipo.Gestor,
      setorId: ti.id,
      cargoId: cargoGestor.id,
      gestorId: mariaRh.id, // responde ao RH
    },
  });

  const carlosGestor = await prisma.user.upsert({
    where: { email: 'carlos.gestor@empresa.com' },
    update: {},
    create: {
      nome: 'Carlos Pereira',
      email: 'carlos.gestor@empresa.com',
      senha: 'gestor123',
      cpf: '99988877766',
      idade: 42,
      salario: 9500,
      tipo: Tipo.Gestor,
      setorId: financeiro.id,
      cargoId: cargoGestor.id,
      gestorId: mariaRh.id,
    },
  });

  // Colaboradores subordinados
  await prisma.user.create({
    data: {
      nome: 'Ana Costa',
      email: 'ana.costa@empresa.com',
      senha: 'func123',
      cpf: '12312312312',
      idade: 28,
      salario: 5000,
      tipo: Tipo.Funcionario,
      setorId: ti.id,
      cargoId: cargoDev.id,
      gestorId: joaoGestor.id,
    },
  });

  await prisma.user.create({
    data: {
      nome: 'Bruno Lima',
      email: 'bruno.lima@empresa.com',
      senha: 'func123',
      cpf: '32132132132',
      idade: 30,
      salario: 4500,
      tipo: Tipo.Funcionario,
      setorId: financeiro.id,
      cargoId: cargoAnalista.id,
      gestorId: carlosGestor.id,
    },
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });