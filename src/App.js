import SuggestionScreen from './pages/suggestionScreen'
import AllClassesPage from './pages/allClassespage';
import CMDBForm from './pages/cmdbForm';
import AHPComparisonSurvey from './pages/AHPComparisonSurvey';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Matrix from './pages/matrix';
import SurveyForm from './pages/surveyForm';
import Table from './pages/tables';
import Login from './pages/login';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path = "/" element = {<Login />} />
        <Route path= '/form' element = {<CMDBForm />} />
        <Route path= '/suggestions' element = {<SuggestionScreen />} />
        <Route path= '/all-classes' element = {<AllClassesPage />} />
        <Route path= '/ahp-survey' element = {<AHPComparisonSurvey />} />
        <Route path= '/matrix' element = {<Matrix />} />
        <Route path= '/survey' element = {<SurveyForm />} />
        <Route path= '/table' element = {<Table />} />
      </Routes>
    </Router>

  );
}

export default App;
