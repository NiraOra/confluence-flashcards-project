import React, { useEffect, useState } from 'react';
import { invoke, view} from '@forge/bridge';
import Breadcrumbs, { BreadcrumbsItem } from '@atlaskit/breadcrumbs';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from '@atlaskit/modal-dialog';
import ModalDialog from '@atlaskit/modal-dialog';
import Button, { IconButton } from '@atlaskit/button/new';
import CrossIcon from '@atlaskit/icon/glyph/cross';
import { Flex, Grid, xcss } from '@atlaskit/primitives';
import { Alert, Collapse } from '@mui/material';
import Chip from '@mui/material/Chip';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import SearchIcon from '@mui/icons-material/Search';
import { IconButton as MuiIconButton } from '@mui/material';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CreateFlashcardGlobal from './GlobalPageFlashcardCreate';
import EditFlashcardModal from './GlobalPageFlashcardEdit';
import CreateDeckGlobal from './GlobalPageDeckCreate';
import EditDeckModal from './GlobalPageDeckEdit';
import CreateTagGlobal from './GlobalPageTagCreate';
import EditTagGlobal from './GlobalPageTagEdit';
import CardSlider from './components/CardSlider';
import DeckSlider from './components/DeckSlider';
import DeckDisplay from './components/DeckDisplay';
import QuizMode from './components/QuizMode';
import StudyMode from './components/StudyMode';
import QuizResults from './components/QuizResults';
import './GlobalPageModule.css';

// grid and layout styles
const gridStyles = xcss({
    width: '100%',
});

const closeContainerStyles = xcss({
    gridArea: 'close',
});

const titleContainerStyles = xcss({
    gridArea: 'title',
});


function GlobalPageModule() {

  // State Management
  const [flashcards, setFlashcards] = useState([]);
  const [flashdecks, setDecks] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tag Management
  const [cardTagMap, setCardTagMap] = useState([]);
  const [deckTagMap, setDeckTagMap] = useState([]);
  const [selectedTags, setSelectedTags] = useState(tags.map(tag => tag.id)); // All tags selected by default
  const [isMyTagsSelected, setIsMyTagsSelected] = useState(false); //My Tags toggle
  const [hoveredTag, setHoveredTag] = useState(null);
  const [activeTags, setActiveTags] = useState([]);

  // User Id
  const [accountId, setAccountId] = useState(null);

  // Modal States - Flashcards, Decks & Tags
  const [isFlashcardModalOpen, setIsCreateFlashcardOpen] = useState(false);
  const [editingFlashcard, setEditingFlashcard] = useState(null);
  const [isEditFlashcardModalOpen, setIsEditFlashcardModalOpen] = useState(false);
  const [flashcardToDelete, setFlashcardToDelete] = useState(null);
  const [isDeleteFlashcardConfirmOpen, setIsDeleteFlashcardConfirmOpen] = useState(false);

  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState(null);
  const [isEditDeckModalOpen, setIsEditDeckModalOpen] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState(null);
  const [isDeleteDeckConfirmOpen, setIsDeleteDeckConfirmOpen] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState(null); // state for deck display

  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [isEditTagModalOpen, setIsEditTagModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState(null);
  const [isDeleteTagConfirmOpen, setIsDeleteTagConfirmOpen] = useState(false);

  // Study and Quiz Mode
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [viewQuizResult, setViewQuizResult] = useState(null);
  const [pressedButton, setPressedButton] = useState(false);
  const [isQuizResults, setIsQuizResults] = useState(false); // State to hold quiz results

  // State for saving success and error messages
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deleteDeckFromDisplaySuccess, setDeleteDeckFromDisplaySuccess] = useState(false);
  const [showDeleteSuccessAlert, setShowDeleteSuccessAlert] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Naviagation and search
  const [breadcrumbItems, setBreadcrumbItems] = useState([{ href: '#', text: 'FLASH (Home)' }]);
  const [globalPageSearchTerm, setGlobalPageSearchTerm] = useState('');
  const [alignment, setAlignment] = useState('all');


  //************************** INITIAL FETCH ON COMPONENT MOUNT ******************************************************************************************/


  useEffect(() => {
    const fetchAccountId = async () => {
      try {
        const context = await view.getContext(); // Get context from Forge
        setAccountId(context.accountId); // Set the account ID from the context
      } catch (error) {
        console.error("Error fetching context:", error);
      }
    };
    fetchAccountId();
    loadFlashcards();
    loadDecks();
    loadTags();
  }, []);


  //************************** FLASHCARD LOGIC - Create, Edit, Delete, Load (refresh data from backend), Helpers & Rendering******************************/


  //CREATION
  const createFlashcardGlobal = () => {
    setIsCreateFlashcardOpen(true); // Open modal to create flashcard
  };
  const closeFlashcardModal = (shouldRefresh = false) => {
    setIsCreateFlashcardOpen(false);
    refreshFlashcardFrontend();
  };

  //EDITING
  const openFlashcardEditModal = (flashcard) => {
    setEditingFlashcard(flashcard);
    setIsEditFlashcardModalOpen(true);
  };
  const closeFlashcardEditModal = (updatedFlashcard) => {
    setIsEditFlashcardModalOpen(false);
    refreshFlashcardFrontend();
  };

  //DELETION
  const confirmDeleteFlashcard = (flashcard) => {
    setFlashcardToDelete(flashcard);
    setIsDeleteFlashcardConfirmOpen(true);
  };
  const closeDeleteFlashcardConfirm = () => {
    setIsDeleteFlashcardConfirmOpen(false);
    setFlashcardToDelete(null);
    setErrorMessage('');
    setDeleteSuccess(false);
  };
  const deleteFlashcard = async () => {
    setErrorMessage('');
    setIsDeleting(true);
    try {
      const response = await invoke('deleteFlashcard', { cardId: flashcardToDelete.id });
      if (response.success) {
        setDeleteSuccess(true);
        setTimeout(() => {
          closeDeleteFlashcardConfirm();
          setIsDeleting(false);
        }, 400); // Show message and close the modal
        refreshFlashcardFrontend();  // Refresh UI
      } else {
        setErrorMessage(response.error);
        setIsDeleting(false);
        console.error('Error deleting flashcard:', response.error);
      }
    } catch (error) {
      setIsDeleting(false);
      console.error('Error deleting flashcard:', error);
    }
  };
  //RELOADING DATA
  const loadFlashcards = async () => {
    try {
      const response = await invoke('getAllFlashcards', {});
      if (response.success) {
        setFlashcards(response.cards);
        setCardTagMap(response.tags);
      }
    } catch (error) {
      console.error('Error fetching flashcards:', error);
    } finally {
      setLoading(false);
    }
  };

  //HELPERS
  const refreshFlashcardFrontend = () => {
    loadFlashcards();
  };

  // FRONTEND RENDERING
  const renderFlashcardsList = (filteredFlashcards) => {
    return (
    <CardSlider cards={filteredFlashcards} tagMap={cardTagMap} onDelete={confirmDeleteFlashcard} onEdit={openFlashcardEditModal}/>
    );
  };


  //**************** DECK LOGIC - Create, Edit, Delete, Load (refresh data from backend) , Helpers, Error Message Handling & Rendering *******************/


  //CREATION
  const createDeck = () => {
    setIsDeckModalOpen(true); // Open modal to create deck
  };
  const closeDeckModal = (shouldRefresh = false) => {
    setIsDeckModalOpen(false);
    refreshDeckFrontend();
  };

  //EDITING
  const openDeckEditModal = (deck) => {
    setEditingDeck(deck);
    setIsEditDeckModalOpen(true);
  };
  const closeDeckEditModal = (updatedDeck) => {
    setIsEditDeckModalOpen(false);
    refreshDeckFrontend();
  };

  //DELETION
  const confirmDeleteDeck = (deck) => {
    setDeckToDelete(deck);
    setIsDeleteDeckConfirmOpen(true);
  };
  const closeDeleteDeckConfirm = () => {
    setIsDeleteDeckConfirmOpen(false);
    setDeckToDelete(null);
    setErrorMessage('');
    setDeleteSuccess(false);
  };
  const deleteDeck = async () => {
    setErrorMessage('');
    setIsDeleting(true);
    try {
      const response = await invoke('deleteDeck', { deckId: deckToDelete.id });
      if (response.success) {
        setDeleteSuccess(true);
        setTimeout(() => {
          closeDeleteDeckConfirm();
          setIsDeleting(false);

        }, 2000); // display message
        refreshDeckFrontend();  // Refresh UI
      } else {
        setErrorMessage(response.error);
        setIsDeleting(false);
        console.error('Error deleting deck:', response.error);
      }
    } catch (error) {
      setIsDeleting(false);
      console.error('Error deleting deck:', error);
    }
  };

  //RELOADING DATA
  const loadDecks = async () => {
    try {
      const response = await invoke('getAllDecks', {});
      if (response.success) {
        setDecks(response.decks);
        setDeckTagMap(response.tags);
      }
    } catch (error) {
      console.error('Error fetching decks:', error);
    } finally {
      setLoading(false);
    }
  };

  //HELPERS
  const refreshDeckFrontend = () => {
    loadDecks();
  };

  //ERROR MESSAGE HANDLING
  //deletion error message when deck is deleted within deck display mode
  useEffect(() => {
    if (deleteDeckFromDisplaySuccess) {
      setShowDeleteSuccessAlert(true);
      const timer = setTimeout(() => {
        setShowDeleteSuccessAlert(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [deleteDeckFromDisplaySuccess]);

  // FRONTEND RENDERING
   const renderDecksList = (filteredDecks) => (
    <DeckSlider decks={filteredDecks} tagMap={deckTagMap} onDelete={confirmDeleteDeck} onDeckClick={onDeckClick} onEdit ={openDeckEditModal}/>
  );


  //************************** TAG LOGIC - Create, Edit, Delete, Load (refresh data from backend) , Helpers & Rendering****************************************/


  //CREATION
  const createTag = () => {
    setIsTagModalOpen(true); // Open modal to create deck
  };
  const closeTagModal = (shouldRefresh = false) => {
    setIsTagModalOpen(false);
    refreshTagFrontend();
  };

  //EDITING
  const openTagEditModal = (tag) => {
    setEditingTag(tag);
    setIsEditTagModalOpen(true);
  };
  const closeTagEditModal = async () => {
    setIsEditTagModalOpen(false);
    refreshTagFrontend();
    refreshDeckFrontend();
    refreshFlashcardFrontend();
  };

  //DELETION
  const confirmDeleteTag = (tag) => {
    setTagToDelete(tag);
    setIsDeleteTagConfirmOpen(true);
  };
  const closeDeleteTagConfirm = () => {
    setIsDeleteTagConfirmOpen(false);
    setTagToDelete(null);
    setErrorMessage('');
    setDeleteSuccess(false);
  };
  const deleteTag = async () => {
    setErrorMessage('');
    setIsDeleting(true);
    try {
      const response = await invoke('deleteTag', { tagId: tagToDelete.id });
      if (response.success) {
        setDeleteSuccess(true);
        setTimeout(() => {
          closeDeleteTagConfirm();
          setIsDeleting(false);
        }, 2000);
        refreshTagFrontend();
      } else {
        setErrorMessage(response.error);
        setIsDeleting(false);
        console.error('Error deleting tag:', response.error);
      }
    } catch (error) {
      setIsDeleting(false);
      console.error('Error deleting tag:', error);
    }
  };

  //RELOADING DATA
  const loadTags = async () => {
    try {
      const response = await invoke('getAllTags', {});
      if (response.success) {
        setTags(response.tags);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };


  // FRONTEND RENDERING
  const renderTagsList = (filteredTags) => (
    <>
      {filteredTags.length > 0 && (
        <>
          <FormControlLabel
            control={
              <Switch
                checked={selectedTags.length === tags.length}
                onChange={handleAllTagsToggle}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: 'rgb(12, 102, 228)',
                  },
                  '& .MuiSwitch-track': {
                    backgroundColor: 'lightgrey',
                  }
                }}
              />
            }
            label='View All Tags'
            labelPlacement='start'
            sx={{
              margin: 0,
              '& .MuiTypography-root': {
                fontSize: '14px',
                fontFamily: 'inherit',
              }
            }}
          />
          <div className="global-page-badge-container">
            {filteredTags.map((tag, index) => (
              <Box
                key={index}
                onMouseEnter={() => setHoveredTag(tag.id)}
                onMouseLeave={() => setHoveredTag(null)}
                sx={{ position: 'relative', display: 'inline-block', margin: 1 }}
              >
                <Chip
                  label={tag.title || "Tag"}
                  className={`badge ${tag.colour}`}
                  onClick={() => handleTagToggle(tag.id)}
                  onDelete={selectedTags.includes(tag.id) ? () => handleTagToggle(tag.id) : undefined}
                  deleteIcon={selectedTags.includes(tag.id) ? <HighlightOffIcon fontSize="small" className="selected-tag-icon"/> : null}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    boxShadow: activeTags.includes(tag.id) ? 'inset 0 0 0 2px currentColor' : undefined,
                  }}
                />
                {hoveredTag === tag.id && (
                  <Box sx={{
                    position: 'absolute',
                    bottom: '80%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'row',
                    pointerEvents: 'auto',
                  }}>
                    <MuiIconButton className='tag-edit-button'size="small" onClick={() => openTagEditModal(tag)}>
                      <EditIcon />
                    </MuiIconButton>
                    <MuiIconButton className='tag-delete-button' size="small" onClick={() => confirmDeleteTag(tag)}>
                      <DeleteIcon />
                    </MuiIconButton>
                  </Box>
                )}
              </Box>
            ))}
          </div>
        </>
      )}
    </>
  );

  //HELPERS
  const refreshTagFrontend = () => {
    loadTags();
    refreshDeckFrontend();
    refreshFlashcardFrontend();
  };

  //************************** SEARCH and TOGGLE FUNCTIONIONLITY **********************************************************************************************/

  // Functions to toggle tag activity

  const handleTagToggle = (tagId) => {
    setActiveTags((prevActiveTags) => {
      if (prevActiveTags.includes(tagId)) {
        return prevActiveTags.filter(id => id !== tagId);
      } else {
        return [...prevActiveTags, tagId];
      }
    });
    selectedTags.includes(tagId)
    setSelectedTags((prevSelectedTags) =>
      prevSelectedTags.includes(tagId)
        ? prevSelectedTags.filter((id) => id !== tagId) // Deselect if already selected
        : [...prevSelectedTags, tagId] // Select if not yet selected
    );
  };

  const handleAllTagsToggle = () => {
    if (selectedTags.length === tags.length) {
      setSelectedTags([]); // Deselect all if all tags are selected
      setActiveTags([]);
    } else {
      setSelectedTags(tags.map(tag => tag.id)); // Select all tags if not all are selected
      setActiveTags(tags.map(tag => tag.id));
    }
  };

  const handleToggleChange = (event, newAlignment) => {

    if (newAlignment === null) {
      setAlignment(alignment);
      return;
    }
    setAlignment(newAlignment);
    if (newAlignment === 'personal' && !isMyTagsSelected) {
      selectOwnTags();
    } else if (newAlignment === 'all' && isMyTagsSelected) {
      selectOwnTags();
    }
  };

  //Toggle the personal/all switch
  const selectOwnTags = () => {
    setIsMyTagsSelected((prevState) => !prevState); // Toggle the switch
  };

  // handle searchbar input
  const searchGlobalPage = (event) => {
    setGlobalPageSearchTerm(event.target.value);
  };

  //****************FILTERED FLASHCARDS, DECKS, TAGS *******************************************************************************************************/

  const filteredFlashcards = flashcards.filter((card) => {

    const searchTerm = globalPageSearchTerm.toLowerCase();
    const matchesSearch =
    (typeof card.front === 'string' && card.front.toLowerCase().includes(searchTerm)) ||
    (typeof card.back === 'string' && card.back.toLowerCase().includes(searchTerm)) ||
    (card.name && typeof card.name === 'string' && card.name.toLowerCase().includes(searchTerm));

    const matchesTags =  selectedTags.length === 0 || // If "All Tags" is selected

    selectedTags.some(tagId => tags.find(tag => tag.id === tagId && tag.cardIds.includes(card.id)));

    const matchesOwner = (isMyTagsSelected && card.owner === accountId) || !isMyTagsSelected;

    return matchesSearch && matchesTags && matchesOwner;

  });

  const filteredDecks = flashdecks.filter((deck) => {
    const searchTerm = globalPageSearchTerm.toLowerCase();
    const matchesSearch =
    (typeof deck.title === 'string' && deck.title.toLowerCase().includes(searchTerm)) ||
    (deck.description && typeof deck.description === 'string' && deck.description.toLowerCase().includes(searchTerm)) ||
    (deck.name && typeof deck.name === 'string' && deck.name.toLowerCase().includes(searchTerm));

    const matchesTags =  selectedTags.length === 0 || // If "All Tags" is selected

    selectedTags.some(tagId => tags.find(tag => tag.id === tagId && tag.deckIds.includes(deck.id)));

    const matchesOwner = !isMyTagsSelected || deck.owner === accountId;

    return matchesSearch && matchesTags && matchesOwner;
  });

  const filteredTags = tags.filter((tag) => {
    const searchTerm = globalPageSearchTerm.toLowerCase();
    return (
      (typeof tag.title === 'string' && tag.title.toLowerCase().includes(searchTerm))
    );
  });


  //************************** BREADCRUMB MANAGEMENT ********************************************************************************************************/

  //Opening deck display when a deck is clicked and setting breadcrumbs
  const onDeckClick = (deck) => {
    setSelectedDeck(deck);
    setIsStudyMode(false);
    setIsQuizMode(false);
    setIsQuizResults(false);
    setPressedButton(false);

    setBreadcrumbItems([{ href: '#', text: 'FLASH (Home)' }, { href: '#', text: deck.title }]);
  };

  // Handle breadcrumb click back to prior breadcrumb
  const goBackIntermediate = (deleted = false) => {
    if (deleted) {
      setDeleteDeckFromDisplaySuccess(true);
      refreshDeckFrontend();
    } else {
      setDeleteDeckFromDisplaySuccess(false);
    }
  }

  // handle homepage breadcrumb clicked.
  const goBackToHome = () => {
    setSelectedDeck(null);
    setIsStudyMode(false);
    setIsQuizMode(false);
    setIsQuizResults(false);
    setPressedButton(false);
    setErrorMessage('');

    setBreadcrumbItems([{ href: '#', text: 'FLASH (Home)' }]);

    refreshDeckFrontend();
    refreshFlashcardFrontend();
  };

  //handle deck breadcrumb clicked.
  const goBackToDeck = () => {
    setIsStudyMode(false);
    setIsQuizMode(false);
    setIsQuizResults(false);
    setPressedButton(false);
    setErrorMessage('');

    setBreadcrumbItems(prevItems => {
      const updatedItems = prevItems.slice(0, -1);
      return updatedItems;
    });
  };

  //************************** STUDY MODE ******************************************************************************************************************/
  //Start study mode
  const studyMode = async () => {
    const id = selectedDeck.id;
    try {
      const response = await invoke('getDeck', { deckId: id });
      if (response.success) {
        setSelectedDeck(response.deck)
      } else {
        console.error("Error retrieving deck:", response.error);
        return null;
      }
    } catch (error) {
      console.error("Exception in fetchDeck:", error);
      return null;
    }
    setIsStudyMode(true);
    setBreadcrumbItems(prevItems => [
        ...prevItems,
        { href: '#', text: 'Study Mode' }
    ]);
  };

  //Study mode rendering
  if (isStudyMode) {
    return (
      <div>
        <Breadcrumbs>
          {breadcrumbItems.map((item, index) => (
            <BreadcrumbsItem
              key={index}
              href={item.href}
              text={item.text}
              onClick={() => {
                if (item.text === 'FLASH (Home)') {
                  goBackToHome();
                } else if (item.text === selectedDeck.title) {
                  goBackToDeck();
                }
              }}
            />
          ))}
        </Breadcrumbs>
        <StudyMode deck={selectedDeck} onBack={goBackToDeck} />
      </div>
    );
  }

  //************************** QUIZ MODE  **************************************************************************************************************/
  //Start quiz mode
  const quizMode = async () => {
    const id = selectedDeck.id;
    try {
      const response = await invoke('getDeck', { deckId: id });
      if (response.success) {
        setSelectedDeck(response.deck)
      } else {
        console.error("Error retrieving deck:", response.error);
        return null;
      }
    } catch (error) {
      console.error("Exception in fetchDeck:", error);
      return null;
    }
    setIsQuizMode(true);

    setBreadcrumbItems(prevItems => [
        ...prevItems,
        { href: '#', text: 'Quiz Mode' }
    ]);
  };
  //Quiz Mode Rendering
  if (isQuizMode) {
    return (
      <div>
        <Breadcrumbs>
          {breadcrumbItems.map((item, index) => (
            <BreadcrumbsItem
              key={index}
              href={item.href}
              text={item.text}
              onClick={() => {
                if (item.text === 'FLASH (Home)') {
                  goBackToHome();
                } else if (item.text === selectedDeck.title) {
                  goBackToDeck();
                }
              }}
              // className="breadcrumb-item"
            />
          ))}
        </Breadcrumbs>
        <QuizMode deck={selectedDeck} onBack={goBackToDeck} />
      </div>
    );
  }

  //************************** DISPLAYING PAST QUIZ RESULTS  ***************************************************************************************************/
  //Start displaying past quiz results
  const quizResult = async () => {
    setPressedButton(true);
    let index = 0;
    let loopStatus = true;
    let responseArray = [];

    while (loopStatus) {

      try {
        const response = await invoke('viewQuizResults', {
          deckId: selectedDeck.id,
          index: index
        });

        if (response.success) {
          responseArray.push(response);
          setViewQuizResult(responseArray);
          setIsQuizResults(true); // Indicates results to be displayed
          index++;

        } else {
          console.error('Error fetching quiz results:', response.error);
          loopStatus = false;
          setErrorMessage(response.error);

        }
      } catch (error) {
        loopStatus = false;  // Stop the loop on exception
        console.error('Exception caught while fetching quiz results:', error);
        setErrorMessage('An error occurred while fetching quiz results');

      }
    }
    // Only update breadcrumbs if results were successfully fetched
    if (responseArray.length > 0) {
      setBreadcrumbItems(prevItems => [
        ...prevItems,
        { href: '#', text: 'Quiz Results' }
      ]);
    }
  };
  //quiz results rendering
  if (isQuizResults) {
    return (
      <div>
        <Breadcrumbs>
          {breadcrumbItems.map((item, index) => (
            <BreadcrumbsItem
              key={index}
              href={item.href}
              text={item.text}
              onClick={() => {

                if (item.text === 'FLASH (Home)') {
                  goBackToHome();

                } else if (item.text === selectedDeck.title) {
                  goBackToDeck();

                }
              }}
            />
          ))}
        </Breadcrumbs>
        <QuizResults viewQuizResult={viewQuizResult} pressedButton={pressedButton}/>
        <p>Quiz Results component rendered with viewQuizResult data</p>
      </div>
    );
  }

  //************************** RENDERING DECK DISPLAY ********************************************************************************************************/
  if (selectedDeck) {
    return (
      <div >
        <Breadcrumbs>
          {breadcrumbItems.map((item, index) => (
            <BreadcrumbsItem
              key={index}
              href={item.href}
              text={item.text}
              onClick={item.text === 'FLASH (Home)' ? goBackToHome : undefined}
              // className="breadcrumb-item"
              />
          ))}
        </Breadcrumbs>
        <DeckDisplay deck={selectedDeck} tagMap={cardTagMap} deckTags={deckTagMap} startStudyMode={studyMode} startQuizMode={quizMode} startQuizResult={quizResult} goBackToHome={goBackToHome} goBackIntermediate={goBackIntermediate}/>
      </div>
    );
  }


  //*************************************GLOBAL PAGE RENDERING**********************//
  return (
    <div className='global-page-container'>
      {/************************************* HEADER SECTION ***************************************/}
      <div className="global-page-header">
        <div className="global-page-headlines">
          <div className="global-page-headline">
            <AutoAwesomeIcon className="global-page-flash-icon" /> Cardify.ai
          </div>
          <div className="global-page-subheadline">
            The Forge App that allows you to create flashcards in a flash
          </div>
        </div>

        {/* ************** SEARCH BAR AND TOGGLE PERSONAL ITEMS SECTION ****************************** */}
        <div className="global-page-search">
          <ToggleButtonGroup
            color="primary"
            value={alignment}
            exclusive
            onChange={handleToggleChange}
            aria-label="Personal or All"
            className='toggle-button-group'
          >
            <Tooltip title="To view all personal content" disableInteractive>
              <ToggleButton value="personal" className='toggle-button'>Personal</ToggleButton>
            </Tooltip>
            <Tooltip title="To view all content within the site" disableInteractive>
              <ToggleButton value="all" className='toggle-button'>All</ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>

          <div className="global-page-search-box">
            <SearchIcon className="global-page-search-icon" />
            <input
              type="text"
              id="search-input"
              onKeyUp={searchGlobalPage}
              placeholder="Search..."
            />
          </div>
        </div>
      </div>

      {/************ DELETE DECK FROM DECK DISPLAY SUCESSS MESSAGE SECTION ******************************/}
      <Collapse in={showDeleteSuccessAlert} timeout={500}>
        <Alert severity="success">
          Deck deleted successfully!
        </Alert>
      </Collapse>

      {/***********  TAGS SECTION *******************************/}
      <div className='global-page-tags'>Tags<button className='global-page-create-tag-button' onClick={createTag}>+ Create Tag</button></div>
      {loading ? (
        <p>Loading...</p>
      ) : tags.length === 0 ? (
        <p>No tags created. Create a tag to display here.</p>
      ) : (
        renderTagsList(filteredTags)
      )}

      {/************ DECKS SECTION *******************************/}
      <div className='global-page-decks'>Decks<button className='global-page-create-deck-button' onClick={createDeck}>+ Create Deck</button></div>
      {loading ? (
        <p>Loading...</p>
      ) : flashdecks.length === 0 ? (
        <p>No decks created. Create a deck to display here.</p>
      ) : (
        renderDecksList(filteredDecks)
      )}

      {/************ FLASHCARDS SECTION*******************************/}
      <div className='global-page-flashcards'>Flashcards<button className='global-page-create-flashcard-button' onClick={createFlashcardGlobal}>+ Create Flashcard</button></div>
      {loading ? (
        <p>Loading...</p>
      ) : flashcards.length === 0 ? (
        <p>No flashcards created. Create a flashcard to display here.</p>
      ) : (
        renderFlashcardsList(filteredFlashcards)
      )}

      {/* *****************************MODAL POPUPS SECTION****************************** */}

      {/* Flashcard Modal */}
      {isFlashcardModalOpen && (
        <ModalDialog heading="Create Flashcard" onClose={() => closeFlashcardModal(true)}>
          <CreateFlashcardGlobal closeFlashcardModal={closeFlashcardModal} />
        </ModalDialog>
      )}

      {/* Deck Modal */}
      {isDeckModalOpen && (
        <ModalDialog heading="Create Deck" onClose={() => closeDeckModal(true)}>
          <CreateDeckGlobal closeDeckModal = {closeDeckModal}/>
        </ModalDialog>
      )}

      {/* Tag Modal */}
      {isTagModalOpen && (
        <ModalDialog heading="Create Tag" onClose={() => closeTagModal(true)}>
          <CreateTagGlobal closeTagModal = {closeTagModal}/>
        </ModalDialog>
      )}

      {/* Flashcard Delete Confirmation Modal */}
      <ModalTransition>
          {isDeleteFlashcardConfirmOpen && (
              <Modal onClose={closeDeleteFlashcardConfirm}>
                  <ModalHeader>
                      <Grid gap="space.200" templateAreas={['title close']} xcss={gridStyles}>
                          <Flex xcss={closeContainerStyles} justifyContent="end">
                              <IconButton
                                  appearance="subtle"
                                  icon={CrossIcon}
                                  label="Close Modal"
                                  onClick={closeDeleteFlashcardConfirm}
                              />
                          </Flex>
                          <Flex xcss={titleContainerStyles} justifyContent="start">
                              <ModalTitle appearance="danger">Delete Flashcard?</ModalTitle>
                          </Flex>
                      </Grid>
                  </ModalHeader>
                  <ModalBody>
                      <p>Are you sure you want to delete all instances of the flashcard? This action cannot be undone.</p>
                      {deleteSuccess &&
                        <Alert severity="success"> Flashcard deleted successfully! </Alert>
                      }
                      {errorMessage &&
                        <Alert severity="error">{errorMessage} </Alert>
                      }
                  </ModalBody>
                  <ModalFooter>
                    <Button appearance="subtle" onClick={closeDeleteFlashcardConfirm}>Cancel</Button>
                    <Button
                      appearance="danger"
                      onClick={deleteFlashcard}
                      isDisabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                    </Button>
                  </ModalFooter>
              </Modal>
          )}
      </ModalTransition>

      {/* Deck Delete Confirmation Modal */}
      <ModalTransition>
          {isDeleteDeckConfirmOpen && (
              <Modal onClose={closeDeleteDeckConfirm}>
                  <ModalHeader>
                      <Grid gap="space.200" templateAreas={['title close']} xcss={gridStyles}>
                          <Flex xcss={closeContainerStyles} justifyContent="end">
                              <IconButton
                                  appearance="subtle"
                                  icon={CrossIcon}
                                  label="Close Modal"
                                  onClick={closeDeleteDeckConfirm}
                              />
                          </Flex>
                          <Flex xcss={titleContainerStyles} justifyContent="start">
                              <ModalTitle appearance="danger">Delete Deck?</ModalTitle>
                          </Flex>
                      </Grid>
                  </ModalHeader>
                  <ModalBody>
                      <p>Are you sure you want to delete all instances of the deck? This action cannot be undone.</p>
                      {deleteSuccess &&
                        <Alert severity="success">Deck deleted successfully!</Alert>
                      }
                      {errorMessage &&
                        <Alert severity="error"> {errorMessage} </Alert>
                      }
                  </ModalBody>
                  <ModalFooter>
                      <Button appearance="subtle" onClick={closeDeleteDeckConfirm}>Cancel</Button>
                      <Button
                      appearance="danger"
                      onClick={deleteDeck}
                      isDisabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                    </Button>
                  </ModalFooter>
              </Modal>
          )}
      </ModalTransition>

      {/* Tag Delete Confirmation Modal */}
      <ModalTransition>
          {isDeleteTagConfirmOpen && (
              <Modal onClose={closeDeleteTagConfirm}>
                  <ModalHeader>
                      <Grid gap="space.200" templateAreas={['title close']} xcss={gridStyles}>
                          <Flex xcss={closeContainerStyles} justifyContent="end">
                              <IconButton
                                  appearance="subtle"
                                  icon={CrossIcon}
                                  label="Close Modal"
                                  onClick={closeDeleteTagConfirm}
                              />
                          </Flex>
                          <Flex xcss={titleContainerStyles} justifyContent="start">
                              <ModalTitle appearance="danger">Delete Tag?</ModalTitle>
                          </Flex>
                      </Grid>
                  </ModalHeader>
                  <ModalBody>
                      <p>Are you sure you want to delete all instances of the tag? This action cannot be undone.</p>
                      {deleteSuccess &&
                        <Alert severity="success">Tag deleted successfully!</Alert>
                      }
                      {errorMessage &&
                        <Alert severity="error"> {errorMessage} </Alert>
                      }
                  </ModalBody>
                  <ModalFooter>
                    <Button appearance="subtle" onClick={closeDeleteTagConfirm}>Cancel</Button>
                    <Button
                      appearance="danger"
                      onClick={deleteTag}
                      isDisabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                    </Button>
                  </ModalFooter>
              </Modal>
          )}
      </ModalTransition>

      {/* Flashcard Edit Modal */}
      {isEditFlashcardModalOpen && (
        <ModalDialog heading="Edit Flashcard" onClose={closeFlashcardEditModal}>
          <EditFlashcardModal
            flashcard={editingFlashcard} // Pass the flashcard to the modal
            closeFlashcardEditModal={closeFlashcardEditModal}
          />
        </ModalDialog>
      )}

      {/* Tag Edit Modal */}
      {isEditTagModalOpen && (
        <ModalDialog heading="Edit Tag" onClose={() => closeTagEditModal(true)}>
          <EditTagGlobal
            tag={editingTag} // Pass the tag to the modal,
            closeTagEditModal={closeTagEditModal}
          />
        </ModalDialog>
      )}

      {/* Deck Edit Modal */}
      {isEditDeckModalOpen && (
        <ModalDialog heading="Edit Deck" onClose={closeDeckEditModal}>
          <EditDeckModal
            deck={editingDeck} // Pass the flashcard to the modal
            closeDeckEditModal={closeDeckEditModal}
          />
        </ModalDialog>
      )}

    </div>
  );
}

export default GlobalPageModule;