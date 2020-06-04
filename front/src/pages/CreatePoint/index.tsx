import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import './style.css';
import logo from '../../assets/logo.svg';
import {Link, useHistory} from 'react-router-dom';
import {FiArrowLeft} from 'react-icons/fi';
import axios from 'axios';
import {Map, TileLayer, Marker} from 'react-leaflet';
import {LeafletMouseEvent} from 'leaflet';
import api from '../../services/api';


interface Item{
    id: number,
    title: string,
    image_url: string
}

interface IBGEUFResponse{
    sigla: string
}

interface IBGECityResponse{
    nome: string
}


const CreatePoint = () =>{
    const [items, setItems] = useState<Item[]>([]);
    const [ufs, setUfs] = useState<string[]>([]);
    const [selectedUf, setSelectedUf] = useState('0');
    const [cities, setCities] = useState<string[]>([]);
    const [selectedCity, setSelectedCity] = useState('0');
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);
    const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);
    const[formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: '',
    });
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const history = useHistory();

    //posição atual do usuário baseada na info obtida pelo navegador
    useEffect(() =>{
        navigator.geolocation.getCurrentPosition(position => {
            console.log(position);
        });
    }, []);
    

    useEffect(() => {
        api.get('items').then(response => {
            setItems(response.data);
        });
    }, []);

    //carregando variável de estado contendo as UFs
    useEffect(() => {
        axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response => {
            const ufInitials = response.data.map(uf => uf.sigla);

            setUfs(ufInitials);
        });
    }, []);
    
    //carregando cidades baseado na UF selecionada
    useEffect(() => {
       if(selectedUf === '0'){
           return;
       }

        console.log(selectedUf);

        axios
            .get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`)
            .then(response => {
                const cityNames = response.data.map(city => city.nome);

                setCities(cityNames);
        });
        console.log(cities);
    }, [selectedUf]);

    //seta a UF selecionada baseada na mudança de input
    function handleselectUf(event: ChangeEvent<HTMLSelectElement>){
        const uf = event.target.value;
        setSelectedUf(uf);
    }

    //seta a cidade selecionada baseada na mudança de input
    function handleselectCity(event: ChangeEvent<HTMLSelectElement>){
        const city = event.target.value;
        setSelectedCity(city);
    }
    
    //seta a latitude e longitude do ponto clicado no mapa
    function handleMapClick(event: LeafletMouseEvent){
        setSelectedPosition([
            event.latlng.lat,
            event.latlng.lng,
        ]);
    }

    //adiciona informação aos dados a serem enviados, sem substituir os dados já cadastrados /nome/email/whatsapp
    function handleInputChange(event: ChangeEvent<HTMLInputElement>){
        const {name, value} = event.target;
        setFormData({...formData, [name]: value});
    }
    
    //seleciona um ou mais items, ou deseleciona ao clicar naqueles que ja foram selecionados
    function handleSelectItem(id: number){
        const alreadySelected = selectedItems.findIndex(item => item == id); //retorna >= 0 se o item já estiver selecionado

        if(alreadySelected >= 0){
            const filteredItems = selectedItems.filter(item => item !== id);
            setSelectedItems(filteredItems);
        }else{
            setSelectedItems([...selectedItems, id]);
        }

    }

    //faz o post pela api para enviar o formulário
    async function handleSubmit(event: FormEvent){
        event.preventDefault();

        const {name, email, whatsapp} = formData;
        const uf = selectedUf;
        const city = selectedCity;
        const [latitude, longitude] = selectedPosition;
        const items = selectedItems;

        const data = {
            name,
            email,
            whatsapp,
            uf,
            city,
            latitude,
            longitude,
            items 
        };
        await api.post('points', data);

        alert('Ponto de coleta Criado!');
        history.push('/');
    }
    
    return(
        <div id="page-create-point">
            <header>
                <img src={logo} alt="ecoleta"/>
                <Link to="/">
                    <FiArrowLeft/>
                    Voltar para home
                </Link>
            </header>
            <form onSubmit={handleSubmit}>
                <h1>Cadastro do <br/> ponto de coleta</h1>

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>
                    <div className="field">
                            <label htmlFor="name">Nome da Entidade</label>
                            <input 
                                type="text"
                                name="name"
                                id="name"
                                onChange={handleInputChange}
                            />
                    </div>
                    <div className="field-group">
                        <div className="field">
                                <label htmlFor="email">Email</label>
                                <input 
                                    type="email"
                                    name="email"
                                    id="email"
                                    onChange={handleInputChange}
                                />
                        </div>
                        <div className="field">
                                <label htmlFor="whatsapp">Whatsapp</label>
                                <input 
                                    type="text"
                                    name="whatsapp"
                                    id="whatsapp"
                                    onChange={handleInputChange}
                                />
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <div className="d-flex-between">
                            <h2>Endereço</h2>
                            <span>Selecione o endereço no mapa</span>
                        </div>
                    </legend>

                    <Map center={[-27.6327123,-48.6435796]} zoom={17} onClick={handleMapClick}>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={selectedPosition}/>
                    </Map>


                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado(UF)</label>
                            <select
                                onChange={handleselectUf}
                                value={selectedUf} 
                                name="uf" 
                                id="uf"
                            >
                                <option value="0">Selecione uma UF</option>
                                {
                                ufs.map(uf =>(
                                    <option key={uf} value={uf}>{uf}</option>
                                ))
                                }
                            </select>
                           
                        </div>
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select
                                name="city" 
                                id="city"
                                value={selectedCity}
                                onChange={handleselectCity}
                            >
                                <option value="0">Selecione uma cidade</option>
                                {
                                cities.map(city =>(
                                    <option key={city} value={city}>{city}</option>
                                ))
                                }

                            </select>
                        </div>
                    </div>



                </fieldset>

                <fieldset>
                    <legend>
                        <div className="d-flex-between">
                            <h2>Itens de coleta</h2>
                            <span>Selecione um ou mais itens abaixo</span>
                        </div>
                    </legend>

                    <ul className="items-grid">
                        {items.map(item => (
                            
                            <li 
                                key={item.id} 
                                onClick={() => handleSelectItem(item.id)}
                                className={selectedItems.includes(item.id) ? 'selected' : ''}
                            >
                                <img src={item.image_url} alt="Oleo"/>
                                <span>{item.title}</span>
                            </li>
                            
                        ))}
                        
                    </ul>
                </fieldset>
                <button type="submit">
                    Cadastrar ponto de coleta
                </button>
            </form>
        </div>
    );
}

export default CreatePoint;