// Faz a importação do express
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

// O servidor ouvirá as requisições na porta especificada
app.listen(3333);