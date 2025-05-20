
import express from 'express';
import mongoose from "mongoose";
import cors from 'cors';
import puppeteer from "puppeteer";
import fs from 'fs/promises';



const porta = process.env.PORT || 3001

const app = express();
app.use(express.json())
app.use(cors())



mongoose.connect('mongodb+srv://rodrigoleiro:Q67wuTXpc3VI0ymZ@orcamentos.3xy54cl.mongodb.net/?retryWrites=true&w=majority&appName=orcamentos', {

}).then(() => {
  console.log('Conectado no banco')

}).catch((error) => {
  console.error('Erro ao conectar no banco:', error);
})


const orcamentos = mongoose.model("orcamento", {
  veiculo: String,
  cor: String,
  cliente: String,
  servico: [{
    item: Number,
    descricao: String,
    valor: Number
  }],

  total: Number
})



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

    const html = `
   <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Orçamento</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ccc; padding: 8px; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <header>
    <h2>R.F.R Oficina, Funilaria e Pintura EIRELE - ME</h2>
    <p>Rua Boa Esperança, Nº 112, Centro Dias D’Ávila-BA</p>
    <span>(Bel Car)</span>
  </header>

  <h1>Orçamento</h1>

  <p><strong>Cliente:</strong> ${orcamento.cliente || 'N/A'}</p>
  <p><strong>Veículo:</strong> ${orcamento.veiculo || 'N/A'}</p>
  <p><strong>Cor:</strong> ${orcamento.cor || 'N/A'}</p>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Descrição</th>
        <th>Valor (R$)</th>
      </tr>
    </thead>
    <tbody>
      ${orcamento.servico.map(s =>
      `<tr>
          <td>${s.item || ''}</td>
          <td>${s.descricao || ''}</td>
          <td>${!isNaN(Number(s.valor)) ? Number(s.valor).toFixed(2) : '0.00'}</td>
        </tr>`
    ).join('')}
    </tbody>
  </table>

  <h3>Total: R$ ${!isNaN(Number(orcamento.total)) ? Number(orcamento.total).toFixed(2) : '0.00'}</h3>
</body>
</html>
`;

    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close()

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename= ${orcamento.cliente.replace(/\s+/g, '-')}.pdf`);
    res.send(pdfBuffer)


  } catch (error) {
    console.error("Erro ao gerar PDF: ", error)
    res.status(500).json({ message: "Erro interno ao gerar o orçamento", erro: error.message });
  }
});


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