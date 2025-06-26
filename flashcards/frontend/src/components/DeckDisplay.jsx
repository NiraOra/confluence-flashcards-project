import React, { useState, useEffect } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import QuizIcon from '@mui/icons-material/Quiz';
import StyleIcon from '@mui/icons-material/Style';
import Tooltip from '@mui/material/Tooltip';
import { Alert, Collapse } from '@mui/material';
import { invoke } from '@forge/bridge';
import Button, { IconButton } from '@atlaskit/button/new';
import CrossIcon from '@atlaskit/icon/glyph/cross';
import { Flex, Grid, xcss } from '@atlaskit/primitives';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from '@atlaskit/modal-dialog';
import './DeckDisplay.css';
import CreateFlashcardGlobal from '../GlobalPageFlashcardCreate';
import EditFlashcardGlobal from '../GlobalPageFlashcardEdit';
import ModalDialog from '@atlaskit/modal-dialog';
import DeckDisplayAddFlashcards from '../DeckDisplayAddFlashcards';
import EditDeckModal from '../GlobalPageDeckEdit';
import SearchIcon from '@mui/icons-material/Search';
import PercentIcon from '@mui/icons-material/Percent';


// Grid and Layout styles
const gridStyles = xcss({
  width: '100%',
});

const closeContainerStyles = xcss({
  gridArea: 'close',
});

const titleContainerStyles = xcss({
  gridArea: 'title',
});

const DeckDisplay = ({ deck, tagMap = [], deckTags = [], startStudyMode, startQuizMode, startQuizResult, goBackToHome, goBackIntermediate }) => {
  //************************** STATE MANAGEMENT *************************************************************************//
  // State for the search bar
  const [deckDisplaySearchTerm, setDeckDisplaySearchTerm] = useState('');

  // State hooks to manage modal visibility, the selected flashcard for deletion, and the updated deck state
  const [isFlashcardDeleteModalOpen, setFlashcardDeleteModalOpen] = useState(false);
  const [isDeckDeleteModalOpen, setDeckDeleteModalOpen] = useState(false);
  const [flashcardToDelete, setFlashcardToDelete] = useState(null);
  const [updatedDeck, setUpdatedDeck] = useState(deck);
  const [isFlashcardEditModalOpen, setIsEditFlashcardOpen] = useState(false); 
  const [flashcardToEdit, setFlashcardToEdit] = useState(null); 

  // Create flashcards
  const [flashcards, setFlashcards] = useState([]);
  const [isFlashcardModalOpen, setIsCreateFlashcardOpen] = useState(false);

  // State for DECK editing and confirmation
  const [editingDeck, setEditingDeck] = useState(null); 
  const [isEditDeckModalOpen, setIsEditDeckModalOpen] = useState(false);

  // STATE for Add flashcard
  const [isAddFlashcardModalOpen, setIsAddFlashcardModalOpen] = useState(false);

  // STATE for Success and error alerts (adding and deleting deck)
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);

  // State to check if the deck is disabled based on the number of cards
  const isDisabled = updatedDeck.cards?.length === 0;
  
  //************************** CHECKS FOR QUIZ RESULTS ON MOUNT ******************************************//
  const [isQuizDisabled, setIsQuizDisabled] = useState(true);

  const checkQuizResults = async () => {
    try {
      const response = await invoke('viewQuizResults', {
        deckId: deck?.id || '',
        index: 0,
      });

      if (response && response.success) {
        setIsQuizDisabled(false);
      } else {
        setIsQuizDisabled(true);
      }
    } catch (error) {
      setIsQuizDisabled(true);
    }
  };

  useEffect(() => {
    if (deck) {
      checkQuizResults();
    }
  }, [deck]);

  //************************** SUCCESS AND ERROR ALERT COMPONENTS **************************************//
  useEffect(() => {
    console.log('consol log');
    if (saveSuccess && errorMessage === '') {
      setShowSuccessAlert(true);
      console.log('save message shown, here is the current deck? ', deck);
      console.log('save message shown, here is the updated deck', updatedDeck);

      const timer = setTimeout(() => {
          setShowSuccessAlert(false);
      }, 2000); // 2000 ms = 2 seconds

      // Clear timeout if the component unmounts
      return () => clearTimeout(timer);
    }
  }, [saveSuccess, errorMessage]);

  useEffect(() => {
    if (errorMessage) {
      setShowErrorAlert(true);

      const errorTimer = setTimeout(() => {
      setShowErrorAlert(false);
      }, 2000); // Show error alert for 2 seconds

      return () => clearTimeout(errorTimer); // Clear timeout if component unmounts
    }
  }, [errorMessage]);

  //************************** DECK SEARCH COMPONENTS ***************************************************//
  const searchDeckDisplay = (event) => {
    console.log('consol log');
    setDeckDisplaySearchTerm(event.target.value);
    console.log('Searching:', deckDisplaySearchTerm);
  };

  const filteredFlashcards = updatedDeck.cards.filter((card) => {
    console.log('consol log');
    const searchTerm = deckDisplaySearchTerm.toLowerCase();
    return (
      (typeof card.front === 'string' && card.front.toLowerCase().includes(searchTerm)) ||
      (typeof card.back === 'string' && card.back.toLowerCase().includes(searchTerm)) ||
      (card.name && typeof card.name === 'string' && card.name.toLowerCase().includes(searchTerm))
    );
  });

  //************************** DECK EDIT COMPONENTS *****************************************************//

  const openDeckEditModal = (deck) => {
    console.log('opening deck edit modal. current deck:', deck);
    setEditingDeck(deck);
    setIsEditDeckModalOpen(true);
  };

  // Close the edit modal and refresh flashcards
  const closeDeckEditModal = (updatedDeck) => {
    console.log('consol log');
    setIsEditDeckModalOpen(false);
    console.log('Closing deck edit modal. New deck:', updatedDeck);
    setUpdatedDeck(updatedDeck);
    console.log('updated deck set', updatedDeck);
  };

  //************************** FLASHCARD CREATE COMPONENTS ***********************************************//
  const closeFlashcardModal = async (newFlashcard) => {
    // Log the initiation of the modal closing process
    console.log('Closing flashcard modal. New flashcard:', newFlashcard);

    setIsCreateFlashcardOpen(false);

    if (newFlashcard) {
      const deckId = deck.id; // Assuming `deck` is passed as a prop
      const cardId = newFlashcard.id; // Make sure the newFlashcard has an ID after creation

      // Log the deck and card IDs being used
      console.log(`Deck ID: ${deckId}, Card ID: ${cardId}`);

      console.log(`Invoking addCardToDeck for cardId: ${cardId} and deckId: ${deckId}`);
      try {
        const addCardResponse = await invoke('addCardToDeck', {
            deckId: deckId,
            cardId: cardId,
        });

        // Log the response from the invoke call
        console.log('Response from addCardToDeck:', addCardResponse);
        //console.log('Previous deck state before update:', prevDeck);

        if (addCardResponse.success) {
          // Update the deck state to include the new flashcard
          setUpdatedDeck((prevDeck) => {
            console.log('Previous deck state before update:', prevDeck);
            const updatedCards = [...prevDeck.cards, newFlashcard]; // Add the new flashcard to the cards array
            console.log('New deck state after adding flashcard:', {
                ...prevDeck,
                cards: updatedCards,
            });
            return {
              ...prevDeck,
              cards: updatedCards,
            };
          });

          console.log(`Flashcard ${cardId} added to deck ${deckId}`);
          console.log("updated deck is", updatedDeck);
        } else {
          console.error(`Failed to add flashcard ${cardId} to deck:`, addCardResponse.error);
        }
      } catch (error) {
        console.error('Error invoking addCardToDeck:', error);
      }
    } else {
      console.warn('No new flashcard was provided.');
    }

    try {
      const deckResponse = await invoke('getDeck', {
        deckId: updatedDeck.id, 
      });

      if (deckResponse.success) {
        setUpdatedDeck(deckResponse.deck);
      } else {
        console.error('Failed to fetch the updated deck:', deckResponse.error);
      }
    } catch (error) {
      console.error('Error fetching the updated deck:', error);
    }
    console.log("deck after a flashcard has been addded", updatedDeck);
  };

  const handleCreateFlashcard = () => {
    setIsCreateFlashcardOpen(true); 
    console.log('Add Flashcard button clicked');
  };

  //************************** FLASHCARD ADD COMPONENTS **************************************************//
  const handleAddFlashcard = () => {
    console.log('consol log');
    setIsAddFlashcardModalOpen(true);
    console.log('Add Flashcard button clicked');
  };

  const closeAddDeckModal = async (selectedFlashcards = []) => {
    console.log('closeAddDeckModal invoked. Selected flashcards:', selectedFlashcards);
    setErrorMessage('');
    setIsAddFlashcardModalOpen(false);
    console.log('Modal closed. isAddFlashcardModalOpen set to:', false);

    // Resetting the updated deck to the original deck
    setUpdatedDeck(deck);
    console.log('Updated deck reset to initial deck state:', deck);

    if (selectedFlashcards.length > 0) {
      const deckId = deck.id;
      console.log('Selected flashcards are non-empty. Deck ID:', deckId);

        for (const cardId of selectedFlashcards) {
          console.log(`Processing flashcard ID: ${cardId} for deck ID: ${deckId}`);

          try {
            console.log('Invoking addCardToDeck...');
            const addCardResponse = await invoke('addCardToDeck', {
              deckId: deckId,
              cardId: cardId,
            });

            console.log('Response from addCardToDeck:', addCardResponse);

            if (addCardResponse.success) {
              setSaveSuccess(true);
              console.log(`Success: Flashcard ${cardId} added to deck ${deckId}`);

              setUpdatedDeck((prevDeck) => {
                console.log('Previous deck state:', prevDeck);
                const cardToAdd = flashcards.find(card => card.id === cardId);
                console.log('Card to add:', cardToAdd);

                if (!cardToAdd) {
                  console.error(`Card with ID ${cardId} not found in flashcards.`);
                  return prevDeck;
                }

                const newDeckState = {
                    ...prevDeck,
                    cards: [...prevDeck.cards, cardToAdd],
                };

                console.log('New deck state after adding flashcard:', newDeckState);
                return newDeckState;
              });
            } else {
              setErrorMessage(addCardResponse.error);
              console.error(`Failed to add flashcard ${cardId} to deck:`, addCardResponse.error);
            }
          } catch (error) {
              console.error('Error invoking addCardToDeck:', error);
          }
        }
      } else {
        console.warn('No flashcards selected to add.');
      }
      try {
        const deckResponse = await invoke('getDeck', {
          deckId: updatedDeck.id, 
        });

        if (deckResponse.success) {
          setUpdatedDeck(deckResponse.deck);
        } else {
          console.error('Failed to fetch the updated deck:', deckResponse.error);
        }
      } catch (error) {
        console.error('Error fetching the updated deck:', error);
      }
  };

  //************************** FLASHCARD DELETE COMPONENTS ********************************************//

  // Opens the flashcard delete confirmation modal and sets the selected flashcard to delete
  const openFlashcardDeleteModal = (flashcard) => {
    setFlashcardToDelete(flashcard);
    setFlashcardDeleteModalOpen(true);
  };

  // Closes the flashcard delete confirmation modal and resets the selected flashcard
  const closeFlashcardDeleteModal = () => {
    setFlashcardDeleteModalOpen(false);
    setFlashcardToDelete(null);
  };

  // Handles the deletion of a flashcard from the deck
  const confirmFlashcardDelete = async () => {
    if (!flashcardToDelete) return;

    console.log(`Delete clicked for flashcard ID: ${flashcardToDelete.id} for deck ID: ${deck.id}`);
    try {
      const response = await invoke('removeCardFromDeck', { deckId: deck.id, cardId: flashcardToDelete.id });

      if (response.success) {
        console.log('Flashcard removed from deck successfully.');
        setUpdatedDeck((prevDeck) => ({
          ...prevDeck,
          cards: prevDeck.cards.filter(card => card.id !== flashcardToDelete.id),
        }));
      } else {
        console.error('Error removing flashcard from deck:', response.error);
      }
    } catch (error) {
        console.error('Error in deleting flashcard:', error);
    } finally {
        closeFlashcardDeleteModal();
    }
  };

  //************************** DECK DELETE COMPONENTS ***************************************************//
  const closeDeckDeleteModal = () => {
    setDeckDeleteModalOpen(false);
  };

  const openDeckDeleteModal = () => {
    setDeckDeleteModalOpen(true);
  };

  const handleDeleteDeck = () => {
    console.log('Delete Deck button clicked');
    openDeckDeleteModal();
  };

  const confirmDeckDelete = async () => {
    setErrorMessage('');
    console.log('Deleting deck permanently', deck);
    console.log('Deleting updated permanently', updatedDeck);
    try {
      const response = await invoke('deleteDeck', { deckId: deck.id });
      if (response.success) {
        closeDeckDeleteModal();
        goBackIntermediate(true);
        goBackToHome();
      } else {
        setErrorMessage(response.error);
        console.error('Error deleting deck:', response.error);
        closeDeckDeleteModal();
      }
    } catch (error) {
      setErrorMessage(error);
      console.error('Error deleting deck:', error);
    }
  };

  //************************** FLASHCARD EDIT COMPONENTS ***********************************************//
  const openFlashcardEditModal = (flashcard) => {
    setFlashcardToEdit(flashcard);
    setIsEditFlashcardOpen(true);
  };

  const closeFlashcardEditModal = async (updatedFlashcard) => {
    console.log('consol log');
    setIsEditFlashcardOpen(false);

    if (updatedFlashcard) {
      try {
        const deckResponse = await invoke('getDeck', {
          deckId: updatedDeck.id, 
        });
        if (deckResponse.success) {
          setUpdatedDeck(deckResponse.deck);
        } else {
          console.error('Failed to fetch the updated deck:', deckResponse.error);
        }
      } catch (error) {
        console.error('Error fetching the updated deck:', error);
      }
    }
  };

  return (
    <div className='deck-display-container'>
      <div className='deck-title-and-buttons'>
        <div className='title-left-buttons'>
          <h1>{updatedDeck.title}</h1>
          {/* *********** DECK MODES ****************************** */}
          <div className='left-buttons'>
            {/* *********** STUDY MODE ****************************** */}
            <Tooltip title={isDisabled ? "Add Flashcards to access this feature!" : ""}>
              <span>
                <button
                  className='deck-display-add-study-session-icon'
                  onClick={isDisabled ? undefined : startStudyMode}
                  disabled={isDisabled}
                  style={{
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    opacity: isDisabled ? 0.5 : 1,
                  }}
                >
                  <StyleIcon fontSize='small' /> Study Mode
                </button>
              </span>
            </Tooltip>

            {/* *********** QUIZ MODE ****************************** */}
            <Tooltip title={isDisabled ? "Add Flashcards to access this feature!" : ""}>
              <span>
                <button
                  className='deck-display-quiz-icon'
                  onClick={isDisabled ? undefined : startQuizMode}
                  disabled={isDisabled}
                  style={{
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    opacity: isDisabled ? 0.5 : 1,
                  }}
                >
                  <QuizIcon fontSize='small' /> Quiz Mode
                </button>
              </span>
            </Tooltip>

            {/* *********** QUIZ RESULTS PAGE ****************************** */}
            <Tooltip title={isQuizDisabled ? "Complete a quiz to access this feature!" : ""}>
              <span>
                <button
                  className='deck-display-quiz-results-icon'
                  onClick={isQuizDisabled ? undefined : startQuizResult}
                  disabled={isQuizDisabled}
                  style={{
                    cursor: isQuizDisabled ? 'not-allowed' : 'pointer',
                    opacity: isQuizDisabled ? 0.5 : 1,
                  }}
                >
                  <PercentIcon fontSize='small' /> View Quiz Results
                </button>
              </span>
            </Tooltip>
          </div>
        </div>

        {/* *********** BUTTONS: CREATE/ADD FLASHCARD, EDIT/DELETE DECK ************************** */}
        <div className='right-buttons'>
          <button className='deck-display-create-flashcard-icon' onClick={handleCreateFlashcard}>
            <AddIcon fontSize='small' /> Create Flashcard
          </button>
          <button className='deck-display-add-flashcard-icon' onClick={handleAddFlashcard}>
            <AddIcon fontSize='small' /> Add Flashcard
          </button>
          <button className='deck-display-edit-icon' onClick={openDeckEditModal}>
            <EditIcon fontSize='small' /> Edit Deck
          </button>
          <button className='deck-display-delete-icon' onClick={handleDeleteDeck}>
            <DeleteIcon fontSize='small' /> Delete Deck
          </button>
        </div>
      </div>

      {/* *********** SEARCH BAR ****************************** */}
      <div className="global-page-search">
        <div className="global-page-search-box">
          <SearchIcon className="global-page-search-icon" />
          <input
            type="text"
            id="search-input"
            onKeyUp={searchDeckDisplay}
            placeholder="Search..."
          />
        </div>
      </div>

      {/* *********** DECK TAGS ****************************** */}
      <div className='deck-tags'>
        {deckTags[deck.id]?.map((tag) => (
        <span
            key={tag.id}
            className={`badge ${tag.colour}`}
        >
            {tag.title || "Tag"}
        </span>
        ))}
      </div>

      <h4 className='deck-flashcard-amount'>Flashcards: {updatedDeck.cards?.length || 0}</h4>

      {/* *********** SUCCESS OR ERROR ALERT ****************************** */}
      <Collapse in={showSuccessAlert} timeout={500}>
          <Alert severity="success">Flashcards added successfully!</Alert>
      </Collapse>
      <Collapse in={showErrorAlert} timeout={500}>
          {errorMessage && <Alert severity="error">{errorMessage}</Alert> }
      </Collapse>

      {/* *********** FLASHCARDS SECTION ****************************** */}
      {updatedDeck && updatedDeck.cards && updatedDeck.cards.length > 0 ? (
        <div className="card-wrapper">
          <ul className="card-list">
            {filteredFlashcards.map((flashcard) => (
              <li key={flashcard.id} className="card-item">
                <div className="card-link">
                  <div className='card-tags'>
                  {tagMap[flashcard.id]?.map((tag) => (
                  <span
                    key={tag.id}
                    className={`badge ${tag.colour}`}
                  >
                    {tag.title || "Tag"}
                  </span>
                  ))}
                  </div>

                  <h4 className="card-front">{flashcard.front || 'No front available'}</h4>
                  <h4 className="card-back">{flashcard.back || 'No back available'}</h4>
                  <h4 className="card-owner">By {flashcard.name || 'Unknown'}</h4>

                  <div className="card-button">
                    <EditIcon
                      className="card-edit-button"
                      onClick={() => openFlashcardEditModal(flashcard)}
                    />
                    <DeleteIcon
                      className="card-delete-button"
                      onClick={() => openFlashcardDeleteModal(flashcard)}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>No flashcards in this deck.</p>
      )}

      {/* Flashcard Delete Modal */}
      <ModalTransition>
        {isFlashcardDeleteModalOpen && (
          <Modal onClose={closeFlashcardDeleteModal}>
            <ModalHeader>
              <Grid gap="space.200" templateAreas={['title close']} xcss={gridStyles}>
                <Flex xcss={closeContainerStyles} justifyContent="end" alignItems="center">
                  <IconButton
                    appearance="subtle"
                    icon={CrossIcon}
                    label="Close Modal"
                    onClick={closeFlashcardDeleteModal}
                  />
                </Flex>
                <Flex xcss={titleContainerStyles} justifyContent="start" alignItems="center">
                  <ModalTitle appearance="danger">Are you sure you want to delete this flashcard?</ModalTitle>
                </Flex>
              </Grid>
            </ModalHeader>
            <ModalBody>
              <p>This action cannot be undone.</p>
            </ModalBody>
            <ModalFooter>
              <Button appearance="subtle" onClick={closeFlashcardDeleteModal}>No</Button>
              <Button appearance="danger" onClick={confirmFlashcardDelete}>Yes</Button>
            </ModalFooter>
          </Modal>
        )}
      </ModalTransition>

      {/* Deck Delete Modal */}
      <ModalTransition>
        {isDeckDeleteModalOpen && (
          <Modal onClose={closeDeckDeleteModal}>
            <ModalHeader>
              <Grid gap="space.200" templateAreas={['title close']} xcss={gridStyles}>
                <Flex xcss={closeContainerStyles} justifyContent="end" alignItems="center">
                  <IconButton
                    appearance="subtle"
                    icon={CrossIcon}
                    label="Close Modal"
                    onClick={closeDeckDeleteModal}
                  />
                </Flex>
                <Flex xcss={titleContainerStyles} justifyContent="start" alignItems="center">
                  <ModalTitle appearance="danger">Are you sure you want to delete this deck?</ModalTitle>
                </Flex>
              </Grid>
            </ModalHeader>
            <ModalBody>
              <p>This action cannot be undone.</p>
            </ModalBody>
            <ModalFooter>
              <Button appearance="subtle" onClick={closeDeckDeleteModal}>No</Button>
              <Button appearance="danger" onClick={confirmDeckDelete}>Yes</Button>
            </ModalFooter>
          </Modal>
        )}
      </ModalTransition>

      {/* Create Flashcard Modal */}
      {isFlashcardModalOpen && (
        <ModalDialog heading="Create Flashcard" onClose={() => closeFlashcardModal(true)}>
          <CreateFlashcardGlobal closeFlashcardModal={closeFlashcardModal} />
        </ModalDialog>
      )}

      {/* Add Flashcards to Deck Modal */}
      {isAddFlashcardModalOpen && (
        <ModalDialog heading="Add Flashcards To Deck" onClose={() => closeAddDeckModal(true)}>
          <DeckDisplayAddFlashcards deck={updatedDeck} closeAddDeckModal = {closeAddDeckModal}/>
        </ModalDialog>
      )}

      {/* Flashcard Edit Modal */}
      {isFlashcardEditModalOpen && (
        <ModalDialog heading="Edit Flashcard" onClose={() => closeFlashcardEditModal(true)}>
          <EditFlashcardGlobal
            flashcard={flashcardToEdit} // editing the flashcard
            closeFlashcardEditModal={closeFlashcardEditModal} // handle closing etc
          />
        </ModalDialog>
      )}

      {/* Deck Edit Modal */}
      {isEditDeckModalOpen && (
        <ModalDialog heading="Edit Deck" onClose={() => closeDeckEditModal(true)}>
        <EditDeckModal
          deck={deck} // Pass the deck to the modal
          closeDeckEditModal={closeDeckEditModal}
        />
        </ModalDialog>
      )}
    </div>
  );
};

export default DeckDisplay;