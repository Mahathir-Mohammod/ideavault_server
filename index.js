const express = require('express'); 
const app = express();

const port = 5000;

app.get('/', (req, res) => {
  res.send('Server is running!');
});

app.get('/user', (req, res) => {
  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com'
  };
  res.json(user);
});

app.get('/data', (req, res) => {
  const data = {
    id: 1,
    name: 'Sample Data'
  };
  res.json(data);
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});