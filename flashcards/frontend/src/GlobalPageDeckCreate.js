import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';
import Button, { IconButton } from '@atlaskit/button/new';
import { Field } from '@atlaskit/form';
import Textfield from '@atlaskit/textfield';
import { Flex, Grid, xcss } from '@atlaskit/primitives';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from '@atlaskit/modal-dialog';
import CrossIcon from '@atlaskit/icon/glyph/cross';
import UnlockIcon from '@atlaskit/icon/glyph/unlock';
import LockIcon from '@atlaskit/icon/glyph/lock';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import './GlobalPageDeckCreate.css';

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

function CreateDeckGlobal({ closeDeckModal }) {

  // State management
  const [deckTitle, setDeckTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locked, setLocked] = useState(false);

  const [flashcards, setFlashcards] = useState([]);
  const [selectedFlashcards, setSelectedFlashcards] = useState([]);
  const [flashcardSearchTerm, setFlashcardSearchTerm] = useState('');

  const [showDescription, setShowDescription] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [closeError, setCloseError] = useState(true);

  // load flashcards when modal opens
  useEffect(() => {
    const fetchFlashcards = async () => {
      try {
        const response = await invoke('getAllFlashcards', {});
        if (response.success) {
          setFlashcards(response.cards);
        } else {
          console.error('Error getting flashcards:', response.error);
        }
      } catch (error) {
        console.error('Error fetching flashcards:', error);
      }
    };

    fetchFlashcards();
  }, []);


  // Handle modal closing
  const handleClose = () => {
    if (typeof closeDeckModal === 'function') {
      closeDeckModal();
    } else {
      console.error('closeDeckModal is not a function:', closeDeckModal);
    }
  };

  // Handle saving of the deck
  const handleSave = async () => {

    setErrorMessage('');
    setCloseError(true);

    if (deckTitle.length > 30) {
      setErrorMessage('Deck title must be 30 characters or fewer.');
      return;
    }

    if (description.length > 50) {
      setErrorMessage('Deck description must be 50 characters or fewer.');
      return;
    }

    try {
      const response = await invoke('createDeck', {
        title: deckTitle,
        description: description,
        flashcards: [],
        locked: locked
      });

      if (response.success) {

        setSaveSuccess(true);
        const deckId = response.id;

        for (const cardId of selectedFlashcards) {
          const addCardResponse = await invoke('addCardToDeck', {
            deckId: deckId,
            cardId: cardId
          });

          if (addCardResponse.success) {
            console.log(`Flashcard ${cardId} added to deck ${deckId}`);
          } else {
            console.error(`Failed to add flashcard ${cardId} to deck:`, addCardResponse.error);
          }
        }

        //clear fields and close
        setDeckTitle('');
        setDescription('');
        setSelectedFlashcards([]);
        setTimeout(() => {
          closeDeckModal();
        }, 1000);

      } else {
        setErrorMessage(response.error);
        console.error('Failed to create deck:', response.error);
      }
    } catch (error) {
      console.error('Error invoking createDeck:', error);
    }
  };

  // Handle checkbox change for selecting flashcards
  const handleCheckboxChange = (flashcardId) => {
    if (selectedFlashcards.includes(flashcardId)) {
      setSelectedFlashcards(selectedFlashcards.filter((id) => id !== flashcardId));
    } else {
      setSelectedFlashcards([...selectedFlashcards, flashcardId]);
    }
  };

  // Filter flashcards based on the search term entered
  const filteredFlashcards = flashcards.filter((flashcard) => {
    return flashcard.front.toLowerCase().includes(flashcardSearchTerm.toLowerCase());
  });

  return (
    <ModalTransition>
      <Modal onClose={closeDeckModal}>
        {/************************************* HEADER SECTION ***************************************/}
        <ModalHeader>
          <Grid templateAreas={['title close']} xcss={gridStyles}>
            <Flex xcss={closeContainerStyles} justifyContent="end" alignItems="center">
              <IconButton
                appearance="subtle"
                icon={CrossIcon}
                label="Close Modal"
                onClick={closeDeckModal}
              />
            </Flex>
            <Flex xcss={titleContainerStyles} justifyContent="start" alignItems="center">
              <ModalTitle>Create New Deck</ModalTitle>
            </Flex>
          </Grid>
        </ModalHeader>
        {/************************************* ERROR MESSAGE ***************************************/}
        <ModalBody>
          {errorMessage &&
            <Collapse in={closeError}>
              <Alert
                severity="error"
                onClose={() => setCloseError(false)}
              >
                {errorMessage}
              </Alert>
            </Collapse>
          }

          {/************************************* DECK TITLE FIELD ***************************************/}
          <Field id="deckTitle" name="deckTitle" label="Deck Title">
            {({ fieldProps }) => (
              <Textfield {...fieldProps} value={deckTitle} onChange={(e) => setDeckTitle(e.target.value)} placeholder="Type the deck title here..." />
            )}
          </Field>

          {/************************************* DECK DESCRIPTION FIELD ***************************************/}
          <Field id="description" name="description" label={
            <div onClick={() => setShowDescription(!showDescription)} className="label-clickable">
              <span>Description (Optional)</span>
              <span className="toggle-icon">
                {showDescription ? <ExpandLessIcon fontSize="small"/> : <ExpandMoreIcon fontSize="small" />}
              </span>
            </div>
          }>
            {({ fieldProps }) => (
              <>
                {showDescription && (
                  <Textfield
                    {...fieldProps}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Type a description for the deck..."
                  />
                )}
              </>
            )}
          </Field>

          {/************************************* ADD FLASHCARDS FIELD ***************************************/}
          <Field id="add-flashcards" name="add-flashcards" label={
            <div onClick={() => setShowFlashcards(!showFlashcards)} className="label-clickable">
              <span>Add Flashcards (Optional)</span>
              <span className="toggle-icon">
                {showFlashcards ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </span>
            </div>
          }>
            {() => (
              <div>
                {showFlashcards && (
                  <>
                    <div className="deck-page-search">
                      <div className="deck-page-search-box">
                        <SearchIcon className="deck-page-search-icon" />
                        <input
                          type="text"
                          id="flashcard-search-input"
                          value={flashcardSearchTerm}
                          onChange={(e) => setFlashcardSearchTerm(e.target.value)}
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
              </div>
            )}
          </Field>

          {/************************************* LOCK/UNLOCKED FIELD ***************************************/}
          <Field>
            {() => (
              <span onClick={() => setLocked(!locked)} style={{ cursor: 'pointer', justifyContent: 'flex-end', display: 'flex', alignItems: 'center' }}>
                {locked ? 'This deck will be locked, only the owner can edit and delete' : 'This deck will be unlocked, others can edit and delete'}
                <span>
                  {locked ? (
                    <LockIcon label="Locked" />
                  ) : (
                    <UnlockIcon label="Unlocked" />
                  )}
                </span>
              </span>
            )}
          </Field>

          {/************************************* SUCCESS MESSAGE ***************************************/}
          {saveSuccess && <Alert severity="success"> New deck created successfully! </Alert>}

        </ModalBody>

        {/************************************* ACTION BUTTONS ***************************************/}
        <ModalFooter>
          <Button appearance="subtle" onClick={handleClose}>Cancel</Button>
          <Button appearance="primary" onClick={handleSave}>Create Deck</Button>
        </ModalFooter>
      </Modal>
    </ModalTransition>
  );
}

export default CreateDeckGlobal;
