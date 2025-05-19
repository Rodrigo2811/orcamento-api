
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
           body { font-family: Arial, sans-serif; }
           h1, h2, h3 { color: #333; text-align: center; }
           table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
           th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
           p {font-size: 18px;}
           th { background-color: #f2f2f2; }
           .total { font-weight: bold; }
           span {color: red; font-size: large;}
           header{width: 100%; display: flex;flex-direction: column;
             justify-content: center; align-items: center; height: 160px; gap: 10px;
             text-align: center; padding: 5px; margin: 15px auto; }
           footer {
      width: 100%; display: flex; justify-content: space-evenly;
      text-align: center; margin-top: 120px; gap: 5px;
    }
    footer span {
      margin: 10px 100px;
      border-top: 2px solid black; /* <- Aqui foi aumentada a espessura */
      width: 350px;
      padding: 5px 70px;
    }
         </style>
        </head>
        <body>

          <header>
            <h2>R.F.R Oficina, Funilaria e Pintura EIRELE - ME</h2>
            <p>Rua Boa Esperança, Nº 112, Centro Dias D’Ávila-BA CEP: 42.80-000 <br> Tel.(71) 9 8162-3273 EMAIL:
              oficinabelcarrfr@yahoo.com.br </br> CNPJ: 28.042.796/0001-64 - Inscrição Estadual - 141.459.169 ME
            </p>

            <span >(Bel Car)</span>
          </header>
            <h1>Orçamento</h1>

            <p><strong>Veículo:</strong> ${orcamento.veiculo}</p>
            <p><strong>Cor:</strong> ${orcamento.cor}</p>
            <p><strong>Cliente:</strong> ${orcamento.cliente}</p>

            <h2>Serviços</h2>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                ${orcamento.servico.map(item => `
                  <tr>
                    <td>${item.item}</td>
                    <td>${item.descricao}</td>
                    <td>R$ ${Number(item.valor).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" class="total">Total:</td>
                  <td class="total">R$ ${Number(orcamento.total).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            <footer>

                <span>Cliente</span>
                <span>Bel Car</span>

            </footer>
        </body>
        </html>
      `;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);
    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close()

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename= ${orcamento.cliente.replace(/\s+/g, '-')}.pdf`);
    res.send(pdfBuffer)


  } catch (error) {
    res.status(404).json({ message: "Erro ao gerar o orçamento" });
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