import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';

const Container = styled.div`
  text-align: center;
  margin: 20px;
`;

const Section = styled.div`
  margin-bottom: 20px;
`;

const Card = styled.div`
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin: 10px 0;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  margin: auto;
`;

const ResultCard = styled(Card)`
  background-color: #d4d4d4;
`;

const Input = styled.input`
  padding: 8px;
  margin-right: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 10px;
`;

const Button = styled.button`
  padding: 8px 16px;
  background-color: #4caf50;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 10px;
`;

const AddButton = styled(Button)`
  background-color: #28a745;
`;

const DeleteButton = styled.span`
  cursor: pointer;
  margin-left: 5px;
`;

const DeleteSauveurButton = styled.span`
  cursor: pointer;
  color: red;
  margin-left: 10px;
`;

const FullSauveurIndicator = styled.span`
  color: red;
  font-weight: bold;
`;

const AvailableSpaceIndicator = styled.span`
  color: green;
  font-weight: bold;
`;

const AddIcon = styled.span`
  margin-right: 5px;
  font-size: px;
  font-weight: bold;
  color: #28a745;
  cursor: pointer;
`;

function App() {
  const [sauveurs, setSauveurs] = useState([]);
  const [fetards, setFetards] = useState([]);
  const [results, setResults] = useState([]);
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [maxPassengers, setMaxPassengers] = useState(4);
  const apiKey = 'QBj6dXfw7mReOpyGaDjSEyXYEJ3fUozg';

  const addSauveur = () => {
    if (name.trim() === '' || destination.trim() === '') return;

    const newSauveur = {
      id: uuidv4(),
      name,
      destination,
      passengers: [],
    };

    setSauveurs([...sauveurs, newSauveur]);
    setName('');
    setDestination('');
  };

  const addFetard = () => {
    if (name.trim() === '' || destination.trim() === '') return;

    if (fetards.some(fetard => fetard.carId)) {
      alert("Le fetard ne peut prendre qu'une seule place dans une voiture.");
      return;
    }

    const newFetard = {
      id: uuidv4(),
      name,
      destination,
    };

    setFetards([...fetards, newFetard]);
    setName('');
    setDestination('');
  };

  const matchPeople = async () => {
    const updatedSauveurs = [...sauveurs];
    const updatedFetards = [...fetards];

    const newResults = [];

    updatedFetards.forEach(async fetard => {
      try {
        if (fetard.carId) return;

        const distances = await Promise.all(
          updatedSauveurs.map(async sauveur => {
            const distance = await calculateDistance(sauveur.destination, fetard.destination);
            return { sauveur, distance };
          })
        );

        distances.sort((a, b) => a.distance - b.distance);

        const closestSauveur = distances.find(item => item.sauveur.passengers.length < maxPassengers);
        if (closestSauveur) {
          if (closestSauveur.sauveur.passengers.length < maxPassengers) {
            closestSauveur.sauveur.passengers.push(fetard);
            const index = updatedFetards.findIndex(f => f.id === fetard.id);
            updatedFetards.splice(index, 1);

            newResults.push({
              sauveur: closestSauveur.sauveur,
              fetard,
            });
          }
        }
      } catch (error) {
        console.error('Erreur lors du calcul de la distance', error);
      }
    });

    setResults(newResults);
    setSauveurs(updatedSauveurs);
    setFetards(updatedFetards);
  };

  const calculateDistance = async (origin, destination) => {
    try {
      const response = await fetch(
        `https://www.mapquestapi.com/directions/v2/route?key=${apiKey}&from=${origin}&to=${destination}`
      );

      const data = await response.json();

      const distance = data.route.distance;
      return distance;
    } catch (error) {
      throw new Error('Erreur lors du calcul de la distance');
    }
  };

  const onDeleteFetard = fetardId => {
    const updatedFetards = fetards.filter(fetard => fetard.id !== fetardId);
    setFetards(updatedFetards);
  };

  const onDeleteFetardFromSauveur = (sauveur, fetard) => {
    const updatedSauveurs = sauveurs.map(s => {
      if (s.id === sauveur.id) {
        const updatedFetards = s.passengers.filter(f => f.id !== fetard.id);
        return { ...s, passengers: updatedFetards };
      }
      return s;
    });

    setSauveurs(updatedSauveurs);
  };

  const onDeleteSauveur = sauveurId => {
    const updatedSauveurs = sauveurs.filter(sauveur => sauveur.id !== sauveurId);
    setSauveurs(updatedSauveurs);
  };

  const onAddFetardToSauveur = sauveur => {
    const newFetard = {
      id: uuidv4(),
      name,
      destination,
    };

    const updatedSauveurs = sauveurs.map(s => {
      if (s.id === sauveur.id && s.passengers.length < maxPassengers) {
        return { ...s, passengers: [...s.passengers, newFetard] };
      }
      return s;
    });

    setSauveurs(updatedSauveurs);
    setName('');
    setDestination('');
  };

  const isSauveurFull = sauveur => sauveur.passengers.length >= maxPassengers;

  const isSauveurAvailable = sauveur => sauveur.passengers.length < maxPassengers;

  const saveData = () => {
    localStorage.setItem('govagoData', JSON.stringify({ sauveurs, fetards, results, maxPassengers }));
  };

  const loadData = () => {
    const savedData = localStorage.getItem('govagoData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setSauveurs(parsedData.sauveurs || []);
      setFetards(parsedData.fetards || []);
      setResults(parsedData.results || []);
      setMaxPassengers(parsedData.maxPassengers || 4);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = () => {
    saveData();
    alert('Données sauvegardées avec succès!');
  };

  return (
    <Container>
      <h1>Govago App</h1>
      <Section>
        <h2>Sauveurs et Fetards</h2>
        {sauveurs.map(sauveur => (
          <Card key={sauveur.id} style={{ borderColor: isSauveurFull(sauveur) ? 'red' : (isSauveurAvailable(sauveur) ? 'green' : '#ddd') }}>
            <span>
              {sauveur.name} - {sauveur.destination} ({sauveur.passengers.length}/{maxPassengers} passagers)
              {isSauveurFull(sauveur) && <FullSauveurIndicator> - Complet</FullSauveurIndicator>}
              {isSauveurAvailable(sauveur) && <AvailableSpaceIndicator> - Places disponibles</AvailableSpaceIndicator>}
            </span>
            <ul>
              {sauveur.passengers.map(fetard => (
                <li key={fetard.id}>
                  <span>Fetard: {fetard.name} - {fetard.destination}</span>
                  <DeleteButton onClick={() => onDeleteFetardFromSauveur(sauveur, fetard)}>❌</DeleteButton>
                </li>
              ))}
            </ul>
            <span onClick={() => onAddFetardToSauveur(sauveur)}>
              <AddIcon>+</AddIcon>Ajouter Fetard
            </span>
            <DeleteSauveurButton onClick={() => onDeleteSauveur(sauveur.id)}>❌ Supprimer Sauveur</DeleteSauveurButton>
          </Card>
        ))}
        <div>
          <Input
            type="text"
            placeholder="Nom, Prénom"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <Input
            type="text"
            placeholder="Destination"
            value={destination}
            onChange={e => setDestination(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Nombre de places"
            value={maxPassengers}
            onChange={e => setMaxPassengers(e.target.value)}
          />
          <AddButton onClick={addSauveur}>
            <AddIcon>+</AddIcon>Ajouter Sauveur
          </AddButton>
        </div>
      </Section>
      <Section>
        <h2>Fetards</h2>
        <ul>
          {fetards.map(fetard => (
            <Card key={fetard.id}>
              <span>{fetard.name} - {fetard.destination}</span>
              <DeleteButton onClick={() => onDeleteFetard(fetard.id)}>❌</DeleteButton>
            </Card>
          ))}
        </ul>
        <div>
          <Input
            type="text"
            placeholder="Nom, Prénom"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <Input
            type="text"
            placeholder="Destination"
            value={destination}
            onChange={e => setDestination(e.target.value)}
          />
          <Button onClick={addFetard}>
            <AddIcon>+</AddIcon>Ajouter Fetard
          </Button>
        </div>
      </Section>
      <Section>
        <h2>Résultats</h2>
        <ul>
          {results.map(result => (
            <ResultCard key={`${result.sauveur.id}-${result.fetard.id}`}>
              <span>{result.sauveur.name} - {result.sauveur.destination} - Sauveur</span>
              <br />
              <span>{result.fetard.name} - {result.fetard.destination} - Fetard</span>
            </ResultCard>
          ))}
        </ul>
      </Section>
      <Button onClick={matchPeople}>Faire correspondre</Button>
      <Button onClick={handleSave}>Sauvegarder</Button>
    </Container>
  );
}

export default App;
