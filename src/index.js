// Faz a importação do express
const { request } = require("express");
const express = require("express");

/**
 * Faz a importação da biblioteca uuid na versão 4
 * que gera o uuid baseado em números aleatórios
 */
const { v4: uudiv4 } = require("uuid");

// Instancia o express
const app = express();

// Indica que o servidor aceita JSON no corpo das requisições
app.use(express.json());

// Array de clientes
const customers = [];

// Middleware de verificação de conta
function verifyIfExistsAccountCPF(request, response, next) {
    // Pega o route param cpf
    const { cpf } = request.headers;

    //Pega o objeto associado ao cpf passado como parâmetro
    const customer = customers.find(customer => customer.cpf === cpf);

    // Verifica se o cliente existe
    if(!customer) {
        return response.status(400).json({error: "Customer not found!"});
    }

    // Passa o objeto customer para as rotas que utilizarão o middleware
    request.customer = customer;

    // Vai para o próximo passo (próxima rota)
    return next();
}

// Função para cálculo do saldo baseado na lista de operações
function getBalance(statement) {
    // O método reduce() retorna o valor do saldo
    const balance = statement.reduce((acc, operation) => {
        if(operation.type === "credit"){
             // Soma ao acumulador acc o valor da operação caso seja de crédito
            return acc + operation.amount;
        }else {
            // Subtrai do acumulador acc o valor da operação caso seja de débito
            return acc - operation.amount;
        }
    }, 0);// O acumulador começão com o valor 0

    // Retorna o valor do saldo
    return balance;
}
/**
 * Account Model: 
 * cpf - string
 * name - string
 * id - uuid (universaly unique identifier)
 * statements []
 */
app.post("/account", (request, response) => {

    // Pega os dados enviados na requisição
    const { cpf, name } = request.body;

    // Verifica se já existe uma conta com o mesmo cpf cadastrado
    const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf);

    // Retorna um erro caso uma conta com o mesmo cpf já exista
    if(customerAlreadyExists) {
        return response.status(400).json({error: "Customer already exists!"});
    }
    // Realiza o cadastro de uma nova conta
    customers.push({
        cpf,
        name,
        id: uudiv4(),// gera um uuid
        statement: []
    })
    // Retorna o status de sucesso
    return response.status(201).send();
});
/**
 * Uma forma de utilizar midlewares é através do app.use(<middelware>)
 * nesse caso o middelware é aplicado a todas as rotas subsequentes
 */
//app.use(verifyIfExistsAccountCPF);

// Passa o middleware para uam rota específica
app.get("/statement/", verifyIfExistsAccountCPF, (request, response) => {

    // Recupera o customer passado através do middleware
    const { customer } = request;

    // Retorna o array de statement do objeto encontrado
    return response.json(customer.statement);
})

// Rota para consulta de extrato filtrando pela data
app.get("/statement/date", verifyIfExistsAccountCPF, (request, response) => {

    // Recupera da data passada através dos query params
    const { date } = request.query;

    // Recupera o cliente passado através do middleware
    const { customer } = request;

    // Cria um objeto Data com a data informada
    const dateFormat = new Date(date);

    // Filtra todas as operações realizadas na data especificada
    const statement = customer.statement.filter((statement) => statement.createdAt.toDateString() === new Date(dateFormat).toDateString());

    // Retorna um array com as operações
    return response.json(statement);
})


// Rota para depósito passando pelo middleware que verifica se a conta existe
app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {

    // Recupera os dados do depósito passados por body params
    const { description, amount } = request.body;

    // Recupera o cliente passado pelo middleware
    const { customer } = request;

    // Cria um objeto para representar a operação de depósito
    const statementOperation = {
        description,
        amount,
        createdAt: new Date(),
        type: "credit"
    }
    
    // Adiciona a opeeração no array de operações do usuário
    customer.statement.push(statementOperation);

    // Retorna o status de sucesso na inserção do depósito
    return response.status(201).send();
})

// Rota para saque passando pelo middleware que verifica se a conta existe
app.post("/withdraw", verifyIfExistsAccountCPF, (request, response) => {
    
    // Recupera o valor do saque passado por body param
    const { amount } = request.body;

    // Recupera o cliente passado pelo middleware
    const { customer } = request;

    // Calcula o saldo em conta
    const balance = getBalance(customer.statement);

    // Verifica se o saldo é insuficiente
    if(balance < amount) {
        // Retorna um erro caso o valor em conta seja menor que o valor do saque
        return response.status(400).json({error: "Insuficient funds!"});
    }

    // Caso o saldo seja suficiente, cria um objeto para representar a operação de saque
    const statementOperation = {
        amount,
        createdAt: new Date(),
        type: "debit"
    }

    // Adiciona o saque à lista de operações do cliente
    customer.statement.push(statementOperation);

    // Retorna o status de sucesso na inserção do saque
    return response.status(201).send();

})

// Rota para atualização do cliente passando pelo middleware que verifica se aconta existe
app.put("/account", verifyIfExistsAccountCPF, (request, response) => {

    // Recupera o nome passado pelo body param
    const { name } = request.body;

    // Recupera o cliente passado pelo middleware
    const { customer } = request;

    // Atualiza o nome do cliente
    customer.name = name;

    // Retorna o status de sucesso na atualização do cliente
    return response.status(201).send();
})

// Rota para recuperar os dados da conta do cliente
app.get("/account", verifyIfExistsAccountCPF, (request, response) => {

    // Recupera o cliente passado pelo middleware
    const { customer } = request;

    // Retorna os dados do cliente
    return response.json(customer);
})

// O servidor ouvirá as requisições na porta especificada
app.listen(3333);