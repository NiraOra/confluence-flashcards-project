import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';
import Button, { IconButton } from '@atlaskit/button/new';
import { Field } from '@atlaskit/form';
import Textfield from '@atlaskit/textfield';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from '@atlaskit/modal-dialog';
import CrossIcon from '@atlaskit/icon/glyph/cross';
import UnlockIcon from '@atlaskit/icon/glyph/unlock';
import LockIcon from '@atlaskit/icon/glyph/lock';
import { Flex, Grid, xcss } from '@atlaskit/primitives';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search';
import './GlobalPageTagCreate.css';

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

function CreateTagGlobal({ closeTagModal }) {

  // State management
  const [tagTitle, setTagTitle] = useState('');
  const [selectedColour, setSelectedColour] = useState('blue');
  const [locked, setLocked] = useState(false);

  const [decks, setDecks] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [selectedDecks, setSelectedDecks] = useState([]);
  const [selectedFlashcards, setSelectedFlashcards] = useState([]);

  const [showDecks, setShowDecks] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [deckSearchTerm, setDeckSearchTerm] = useState('');
  const [flashcardSearchTerm, setFlashcardSearchTerm] = useState('');

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [closeError, setCloseError] = useState(true);

  // Fetch flashcards on mount
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

  // Fetch decks on mount
  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const response = await invoke('getAllDecks', {});
        if (response.success) {
          setDecks(response.decks);
        } else {
          console.error('Error getting decks:', response.error);
        }
      } catch (error) {
        console.error('Error fetching decks:', error);
      }
    };

    fetchDecks();
  }, []);

  // Handle tag modal closing
  const handleClose = () => {
    if (typeof closeTagModal === 'function') {
      closeTagModal(); // Call the function passed as a prop
    } else {
      console.error('closeTagModal is not a function:', closeTagModal);
    }
  };

    // Handle saving of tag
  const handleSave = async () => {
    setErrorMessage('');
    setCloseError(true);
    if (tagTitle.length > 30) {
      setErrorMessage('Tag title must be 30 characters or fewer.');
      return;
    }

    try {
      const tags = await invoke('getAllTags', {});
      const sameTitle = tags.tags.find(tag => tag.title === tagTitle);
      if (sameTitle) {
        setErrorMessage('A tag with this title already exists. Please choose a different title.');
        return;
      }
    } catch (error) {
      console.error('Error invoking getAllTags:', error);
    }

    try {
      const response = await invoke('createTag', {
        title: tagTitle,
        colour: selectedColour || 'blue',
        deckIds: selectedDecks,
        cardIds: selectedFlashcards,
        locked: locked
      });
      //clear fields and close
      if (response.success) {
        setSaveSuccess(true);
        setTagTitle('');
        setTimeout(() => {
          closeTagModal();
        }, 1000);
      } else {
        setErrorMessage(response.error);
        console.error('Failed to create tag:', response.error);
      }
    } catch (error) {
      console.error('Error invoking createTag:', error);
    }
  };

  // Handle checkbox change for selecting decks
  const handleDecksCheckboxChange = (deckId) => {
    if (selectedDecks.includes(deckId)) {
      setSelectedDecks(selectedDecks.filter((id) => id !== deckId));
    } else {
      setSelectedDecks([...selectedDecks, deckId]);
    }
  };

  // Handle checkbox change for selecting flashcards
  const handleFlashcardsCheckboxChange = (flashcardId) => {
    if (selectedFlashcards.includes(flashcardId)) {
      setSelectedFlashcards(selectedFlashcards.filter((id) => id !== flashcardId));
    } else {
      setSelectedFlashcards([...selectedFlashcards, flashcardId]);
    }
  };

  // Filter decks based on the search term entered
  const filteredDecks = decks.filter((deck) => {
    return deck.title.toLowerCase().includes(deckSearchTerm.toLowerCase());
  });

  // Filter flashcards based on the search term entered
  const filteredFlashcards = flashcards.filter((flashcard) => {
    return flashcard.front.toLowerCase().includes(flashcardSearchTerm.toLowerCase());
  });

  return (
    <ModalTransition>
      <Modal onClose={closeTagModal}>

        {/************************************* HEADER SECTION ***************************************/}
        <ModalHeader>
          <Grid templateAreas={['title close']} xcss={gridStyles}>
            <Flex xcss={closeContainerStyles} justifyContent="end" alignItems="center">
              <IconButton
                appearance="subtle"
                icon={CrossIcon}
                label="Close Modal"
                onClick={closeTagModal}
              />
            </Flex>
            <Flex xcss={titleContainerStyles} justifyContent="start" alignItems="center">
              <ModalTitle>Create New Tag</ModalTitle>
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

          {/************************************* TAG TITLE FIELD ***************************************/}
          <Field id="tagTitle" name="tagTitle" label="Tag Title">
            {({ fieldProps }) => (
              <Textfield {...fieldProps} value={tagTitle} onChange={(e) => setTagTitle(e.target.value)} placeholder="Type the tag title here..." />
            )}
          </Field>

          {/************************************* TAG COLOUR SELECTION ***************************************/}
          <Field id="tagColour" name="tagColour" label={`Tag Colour: ${selectedColour.charAt(0).toUpperCase() + selectedColour.slice(1)}`}>
            {() => (
              <div className="badge-container">
                {["blue", "red", "orange", "green", "yellow", "purple"].map((colour) => (
                  <div
                    key={colour}
                    className={`badge ${colour} ${selectedColour === colour ? "selected" : ""}`}
                    onClick={() => setSelectedColour(colour)}
                  >
                    {colour.charAt(0).toUpperCase() + colour.slice(1)}
                  </div>
                ))}
              </div>
            )}
          </Field>

          {/************************************* ADD DECKS FIELD ***************************************/}
          <Field id="add-decks" name="add-decks" label={
            <div onClick={() => setShowDecks(!showDecks)} className="label-clickable">
              <span>Add Tag To Decks (Optional)</span>
              <span className="toggle-icon">
                {showDecks ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </span>
            </div>
          }>
            {() => (
              <div>
                {showDecks && (
                  <>
                    <div className="tag-page-search">
                      <div className="tag-page-search-box">
                        <SearchIcon className="tag-page-search-icon" />
                        <input
                          type="text"
                          id="tag-deck-search-input"
                          value={deckSearchTerm}
                          onChange={(e) => setDeckSearchTerm(e.target.value)}
                          placeholder="Search decks..."
                        />
                      </div>
                    </div>
                    <div className='decks-select-scroll'>
                      {filteredDecks.length > 0 ? (
                        filteredDecks.map((deck) => (
                          <div key={deck.id} className="decks-select-scroll-item">
                            <input
                              type="checkbox"
                              id={`deck-${deck.id}`}
                              checked={selectedDecks.includes(deck.id)}
                              onChange={() => handleDecksCheckboxChange(deck.id)}
                            />
                            <label htmlFor={`deck-${deck.id}`}>
                              {deck.title}
                            </label>
                          </div>
                        ))
                      ) : (
                        <p>No Decks available to select.</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </Field>

          {/************************************* ADD FLASHCARDS FIELD ***************************************/}
          <Field id="add-flashcards" name="add-flashcards" label={
            <div onClick={() => setShowFlashcards(!showFlashcards)} className="label-clickable">
              <span>Add Tag To Flashcards (Optional)</span>
              <span className="toggle-icon">
                {showFlashcards ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </span>
            </div>
          }>
            {() => (
              <div>
                {showFlashcards && (
                  <>
                    <div className="tag-page-search">
                      <div className="tag-page-search-box">
                        <SearchIcon className="tag-page-search-icon" />
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
                              onChange={() => handleFlashcardsCheckboxChange(flashcard.id)}
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
          {/* <Field>
            {() => (
              <span onClick={() => setLocked(!locked)} style={{ cursor: 'pointer', justifyContent: 'flex-end', display: 'flex', alignItems: 'center' }}>
                {locked ? 'This tag will be locked, only the owner can edit and delete' : 'This tag will be unlocked, others can edit and delete'}
                <span>
                  {locked ? (
                    <LockIcon label="Locked" />
                  ) : (
                    <UnlockIcon label="Unlocked" />
                  )}
                </span>
              </span>
            )}
          </Field> */}

          {/************************************* SUCCESS MESSAGE ***************************************/}
          {saveSuccess && <Alert severity="success"> New tag created successfully! </Alert>}

        </ModalBody>

        {/************************************* ACTION BUTTONS ***************************************/}
        <ModalFooter>
          <Button appearance="subtle" onClick={handleClose}>Cancel</Button>
          <Button appearance="primary" onClick={handleSave}>Create Tag</Button>
        </ModalFooter>
      </Modal>
    </ModalTransition>
  );
}

export default CreateTagGlobal;
