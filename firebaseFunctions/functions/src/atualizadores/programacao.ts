import { ProgramacaoInterface } from "../interface/programacao.interface";
import axios from 'axios';


export const atualizandoProgramacao =  (async () => {
const baseUrl = 'https://api.umov.me/CenterWeb/api/43843e568c3fa407c0d69ea8677ae2a92d847b';
    const programacoes: ProgramacaoInterface[] = [];
    let currentPage = 1;
    let hasMorePages = true;
    const urlToGetAllEntries = `${baseUrl}/schedule.xml?scheduleType.id=127939&paging.page=${currentPage}`;
    const responseXmlArr = [];

axios.get(urlToGetAllEntries)
})