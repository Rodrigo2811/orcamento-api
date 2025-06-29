
import express from 'express';
import mongoose from "mongoose";
import cors from 'cors';
import bcrypt from 'bcrypt'
import puppeteer from "puppeteer";
import fs from 'fs/promises';



const porta = process.env.PORT || 3001

const app = express();
app.use(express.json())
app.use(cors())



mongoose.connect('mongodb+srv://rodrigoleiro:Uinuq8amIgnCcv08@orcamentos.3xy54cl.mongodb.net/?retryWrites=true&w=majority&appName=orcamentos', {

}).then(() => {
  console.log('Conectado no banco')

}).catch((error) => {
  console.error('Erro ao conectar no banco:', error);
})


const users = mongoose.model("usuarios", {
  usuario: String,
  senha: String,
  email: String
})

const orcamentos = mongoose.model("orcamento", {
  veiculo: String,
  cor: String,
  cliente: String,
  servico: [{
    _id: mongoose.Schema.Types.ObjectId,
    item: Number,
    descricao: String,
    valor: Number
  }],

  total: Number
})



//ROTAS USUARIO

app.get('/user', async (req, res) => {
  try {
    const respUser = await users.find()
    res.status(200).json(respUser)
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar usuários" })
  }
})


app.post('/user', async (req, res) => {

  const { usuario, senha, email } = req.body


  if (usuario === "") {
    return res.status(400).json({ message: "O campo usuário é obrigatorio " })
  }

  try {
    const hashPassword = await bcrypt.hash(senha, 10)

    const newUser = {
      usuario: usuario,
      senha: hashPassword,
      email: email
    }

    await users.create(newUser)
    return res.status(201).json({ message: "Usuário criado com sucesso" })
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})


app.post('/user/login', async (req, res) => {
  const { usuario, senha } = req.body;

  try {
    const userLogin = await users.findOne({ usuario: usuario.toLowerCase() });

    if (!userLogin) {
      return res.status(400).json({ message: 'Usuário inválido' });
    }

    const isMatch = await bcrypt.compare(senha, userLogin.senha);

    if (isMatch) {
      return res.status(200).json({ message: 'Login efetuado com sucesso' });
    } else {
      return res.status(401).json({ message: 'Senha inválida' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erro ao realizar login', erro: error.message });
  }
});



// ROTAS DE ORCAMENTO

app.get('/orcamento', async (req, res) => {
  try {
    const resposta = await orcamentos.find();
    res.status(200).json(resposta);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar Orçamentos' })
  }
})

app.post("/orcamento", async (req, res) => {
  const { veiculo, cor, cliente, servico, total } = req.body;



  const orcamento = {
    veiculo, cor, cliente, servico, total
  };

  if (veiculo === "") {
    return res.status(400).json({ erro: "O campo veículo é obrigatório" });
  }

  try {
    await orcamentos.create(orcamento);
    res.status(201).json({ message: "Criado com sucesso" });
  } catch (error) {
    res.status(500).json({ erro: error });
  }
});


app.get("/orcamento/:id", async (req, res) => {
  const { id } = req.params

  try {
    const orcamento = await orcamentos.findById(id);
    if (!orcamento) {
      return res.status(404).json({ message: "Orçamento não encontrato" })
    }

    res.status(200).json(orcamento)
  } catch (error) {
    console.error(error)
  }
})

app.get('/orcamentoPDF/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const orcamento = await orcamentos.findById(id).lean();
    if (!orcamento) {
      return res.status(404).json({ message: "Orçamento não encontrado" });
    }

    return res.status(201).json({ message: "PDF gerado com sucesso" })


  } catch (error) {
    console.error("Erro ao gerar PDF: ", error)
    res.status(500).json({ message: "Erro interno ao gerar o orçamento", erro: error.message });
  }
});

app.put("/orcamento/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = req.body

  if (!updateData || Object.keys(updateData).length === 0) {
    return res.status(400).json({ message: "Orçamento não encontrado" })
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "id inválido" })
  }
  try {
    const orcamento = await orcamentos.findById(id)
    if (!orcamento) {
      return res.status(404).json({ message: "Orçamento não encontrado" })
    }

    Object.assign(orcamento, updateData)

    const orcamentoAtt = await orcamento.save()

    return res.status(200).json({
      message: "Orçamento atualizado com sucesso",
      orcamento: orcamentoAtt
    })
  } catch (error) {
    console.error("Erro ao atualizar orçamento:", error)
    return res.status(500).json({ message: "Erro ao atualizar o orçamento.", erro: error.message })
  }

})


app.delete("/orcamento/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const orcamento = await orcamentos.findByIdAndDelete(id);
    if (!orcamento) {
      return res.status(404).json({ message: 'Orçamento não encontrado' })
    }
    res.status(200).json({ message: "Orçamento deletado com sucesso." })
  } catch (error) {
    res.status(500).json({ message: "Erro ao deletar o orçamento" })
  }

});

app.listen(porta, () => {
  console.log('Rodando ' + porta)
})