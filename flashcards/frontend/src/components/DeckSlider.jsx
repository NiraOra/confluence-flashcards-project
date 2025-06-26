import React, { useEffect, useState } from 'react';
import { router } from '@forge/bridge';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/splide/dist/css/splide.min.css';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import './DeckSlider.css';

const DeckSlider = ({ decks = [], tagMap = [], onDelete, onDeckClick, onEdit }) => {

  //Handle link click
  const handleLinkClick = async (url) => {
    try {
      await router.open(url);
    } catch (error) {
      console.error('Navigation failed or user declined to proceed:', error);
    }
  };

  return (
    <div className='container'>
      {/************************************* PAGE DISPLAY ***************************************/}
      <div className='deck-wrapper'>
        <ul className='deck-list'>
          <Splide
            options={{
              type: 'slide',
              perPage: 5,
              pagination: false,
              gap: '10px',
              breakpoints: {
                800: {
                  perPage: 2,
                },

                1000: {
                  perPage: 3,
                },
                1200: {
                  perPage: 4,
                },
              },
            }}
          >
            {/************************************* EACH DECK ITEM IN SPLIDE ***************************************/}
            {decks.map((deck) => (
              deck.title && (
                <SplideSlide key={deck.id} className='deck-item'>
                  {/************************************* CLICKABLE DECK FUNCTIONALITY ***************************************/}
                  <div
                    className="deck-link"
                    onClick={() => {
                      onDeckClick(deck);
                    }}
                  >
                    {/************************************* DECK TAGS ***************************************/}
                    <div className="deck-right-border"></div>
                    <div className="deck-content"></div>
                    <div className='deck-tags'>
                      {tagMap[deck.id]?.map((tag) => (
                          <span
                            key={tag.id}
                            className={`badge ${tag.colour}`}
                          >
                            {tag.title || "Tag"}
                          </span>
                        ))}
                    </div>

                    {/************************************* DECK NAME & FLASHCARD AMOUNT ***************************************/}
                    <h4 className='deck-name'>{deck.title || 'Unnamed Deck'}</h4>
                    <h4 className='deck-flashcard-amount'>Flashcards: {deck.cards?.length || 0}</h4>

                    {/************************************* DECK DESCRIPTION INCLUDING LINK HANDLING***************************************/}
                    {deck.description.includes("Fetched from https://") ? (
                      <div
                        onClick={(e) => {
                          e.stopPropagation(); // Prevents triggering parent onClick
                          handleLinkClick(deck.description.match(/https?:\/\/\S+/)[0]);
                        }}
                        className='ai-deck-description'
                      >
                        View source page
                      </div>

                    ) : (

                      <h4 className='deck-description'>{deck.description}</h4>
                    )}

                    {/************************************* DECK OWNER ***************************************/}

                    <h4 className='deck-owner'>By {deck.name || 'Unknown'}</h4>


                    {/************************************* ACTION BUTTONS ***************************************/}
                    <div className='deck-button'>
                      <EditIcon
                        className='deck-edit-button'
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(deck);
                        }}
                      />
                      <DeleteIcon
                        className='deck-delete-button'
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Delete icon clicked for deck:', deck);
                          onDelete(deck);
                        }}
                      />
                    </div>
                  </div>
                </SplideSlide>
              )
            ))}
          </Splide>
        </ul>
      </div>
    </div>
  );
};

export default DeckSlider;