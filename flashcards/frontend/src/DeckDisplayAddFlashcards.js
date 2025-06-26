import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';
import Button, { IconButton } from '@atlaskit/button/new';
import { Field } from '@atlaskit/form';
import CrossIcon from '@atlaskit/icon/glyph/cross';
import { Flex, Grid, xcss } from '@atlaskit/primitives';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from '@atlaskit/modal-dialog';
import { Alert, Collapse } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import './DeckDisplayAddFlashcards.css';

//grid and layout styles
const gridStyles = xcss({
  width: '100%',
});

const closeContainerStyles = xcss({
  gridArea: 'close',
});

const titleContainerStyles = xcss({
  gridArea: 'title',
});

function DeckDisplayAddFlashcards({ deck, closeAddDeckModal }) {

  //State management
  const [flashcards, setFlashcards] = useState([]);
  const [selectedFlashcards, setSelectedFlashcards] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); // For search functionality

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [closeError, setCloseError] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch flashcards (not in the deck already) on mount
  useEffect(() => {
    const fetchFlashcards = async () => {
      try {
        const response = await invoke('getAllFlashcards', {});
        if (response.success) {
          const flashcardsNotInDeckAlready = response.cards.filter((flashcard) => !deck.cards.some(deckFlashcard => deckFlashcard.id === flashcard.id));
          setFlashcards(flashcardsNotInDeckAlready);
        } else {
          console.error('Error getting flashcards:', response.error);
        }
      } catch (error) {
        console.error('Error fetching flashcards:', error);
      }
    };

    fetchFlashcards();
  }, []);

  // Close modal handler
  const handleClose = () => {
    if (typeof closeAddDeckModal === 'function') {
      closeAddDeckModal(); //function passed as a prop because we are displaying a modal using breadcrumbs
    } else {
      console.error('closeFlashcardModal is not a function:', closeAddDeckModal);
    }
  };

  // Save selected flashcards to the deck
  const handleSave = async () => {

    setErrorMessage('');

    if (selectedFlashcards.length === 0) {
      setErrorMessage('No flashcards are selected');
      return;
    }

    try {
      setSaveSuccess(true)
      setTimeout(() => {
        closeAddDeckModal(selectedFlashcards),
        handleClose();
      }, 1000);
    } catch (error) {
      console.error('Error adding flashcards to deck:', error);
    }
  };

  // Handle checkbox state change for flashcards
  const handleCheckboxChange = (flashcardId) => {
      if (selectedFlashcards.includes(flashcardId)) {
          setSelectedFlashcards(selectedFlashcards.filter((id) => id !== flashcardId));
      } else {
          setSelectedFlashcards([...selectedFlashcards, flashcardId]);
      }
  };

  // Search functionality: Update the search term
  const searchDeckDisplay = (event) => {
    setSearchTerm(event.target.value);
  };

  // Filter flashcards based on the search term
  const filteredFlashcards = flashcards.filter((card) => {
    const filterSearchTerm = searchTerm.toLowerCase();
    return (
      (typeof card.front === 'string' && card.front.toLowerCase().includes(filterSearchTerm)) ||
      (typeof card.back === 'string' && card.back.toLowerCase().includes(filterSearchTerm)) ||
      (card.name && typeof card.name === 'string' && card.name.toLowerCase().includes(filterSearchTerm))
    );
  });

  return (
    <ModalTransition>
      <Modal onClose={closeAddDeckModal}>
        {/************************************* HEADER SECTION ***************************************/}
        <ModalHeader>
          <Grid templateAreas={['title close']} xcss={gridStyles}>
            <Flex xcss={closeContainerStyles} justifyContent="end" alignItems="center">
              <IconButton
                appearance="subtle"
                icon={CrossIcon}
                label="Close Modal"
                onClick={closeAddDeckModal}
              />
            </Flex>
            <Flex xcss={titleContainerStyles} justifyContent="start" alignItems="center">
              <ModalTitle>Add Flashcard/s</ModalTitle>
            </Flex>
          </Grid>
        </ModalHeader>

        {/************************************* ERROR MESSAGE ***************************************/}
        <ModalBody>
          { errorMessage &&
            <Collapse in={closeError}>
              <Alert
                severity="error"
                action={
                  <IconButton
                    aria-label="close"
                    color="inherit"
                    size="small"
                    onClick={() => {
                      setCloseError(false);
                    }}
                  >
                  <CloseIcon fontSize="inherit" />
                  </IconButton>
                }
                sx={{ mb: 2 }}
              >
                {errorMessage}
              </Alert>
            </Collapse>
          }

          {/************************************* ADD FLASHCARDS FIELD ***************************************/}
          <Field id="add-flashcards" name="add-flashcards" label="Add existing flashcards to deck">
            {() => (
              <>
                <div className="global-page-search">
                  <div className="global-page-search-box">
                    <SearchIcon className="global-page-search-icon" />
                    <input
                      type="text"
                      id="search-input"
                      value={searchTerm}
                      onChange={searchDeckDisplay} // Update search term
                      placeholder="Search flashcards..."
                    />
                  </div>
                </div>
                <div className='flashcards-select-scroll'>
                  {filteredFlashcards.length > 0 ? (
                    filteredFlashcards.map((flashcard) => (
                      <div key={flashcard.id} className="flashcards-select-scroll-item">
                        <input
                          type="checkbox"
                          id={`flashcard-${flashcard.id}`}
                          checked={selectedFlashcards.includes(flashcard.id)}
                          onChange={() => handleCheckboxChange(flashcard.id)}
                        />
                        <label htmlFor={`flashcard-${flashcard.id}`}>
                          {flashcard.front || 'No front available'}
                        </label>
                      </div>
                    ))
                  ) : (
                    <p>No flashcards available to select.</p>
                  )}
                </div>
              </>

            )}
          </Field>

          {/************************************* SUCCESS MESSAGE ***************************************/}
          {saveSuccess && <Alert severity="success"> Flashcard/s added to deck successfully! </Alert>}

        </ModalBody>

        {/************************************* ACTION BUTTONS ***************************************/}
        <ModalFooter>
          <Button appearance="subtle" onClick={handleClose}>Cancel</Button>
          <Button appearance="primary" onClick={handleSave}>Add Flashcard/s</Button>
        </ModalFooter>
      </Modal>
    </ModalTransition>
  );
}

export default DeckDisplayAddFlashcards;