import express, { response } from 'express';

//RESPONSAVEL PONTOS DE COLETA
import PointsController from './controllers/PointsController';
//RESPONSAVEL PELOS ITENS COLETADOS
import ItemsController from './controllers/ItemsController';


const routes = express.Router();
const pointsController = new PointsController();
const itemsController = new ItemsController();

routes.get('/items', itemsController.index);

routes.post('/points', pointsController.create);
routes.get('/points', pointsController.index);
routes.get('/points/:id', pointsController.show);

//Request Param: Parametros que vem na própria rota que identificam um recurso
//Query Param: Parametros que vem na própria rota geralmente opcionais para filtros, paginação e etc
//Request Body: Parâmetros para criação/atualização de informações

export default routes;