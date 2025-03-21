"use client";

import { useState, useEffect, useRef } from 'react';
import { allHiragana, allKatakana, allKana, Kana, KanaType } from './data/kana';
import styles from './page.module.css';

export default function Home() {
  const [kanaSet, setKanaSet] = useState<Kana[]>([]);
  const [currentKanaIndex, setCurrentKanaIndex] = useState<number>(0);
  const [input, setInput] = useState<string>('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [wrongKana, setWrongKana] = useState<Kana[]>([]);
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<'hiragana' | 'katakana' | 'both'>('both');
  const [selectedFont, setSelectedFont] = useState<'sans' | 'serif'>('sans');
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [showResponseTime, setShowResponseTime] = useState<boolean>(false);
  const [animationDuration, setAnimationDuration] = useState<number>(1500);
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  // États supplémentaires pour la sélection précise des kana
  const [advancedSelectionMode, setAdvancedSelectionMode] = useState<boolean>(false);
  const [selectedCategories, setSelectedCategories] = useState<{
    hiragana: boolean;
    katakana: boolean;
    basic: boolean;
    dakuten: boolean;
    combined: boolean;
    groups: {[key: string]: boolean};
  }>({
    hiragana: true,
    katakana: true,
    basic: true,
    dakuten: true, 
    combined: true,
    groups: {
      'a': true, 'ka': true, 'sa': true, 'ta': true, 'na': true,
      'ha': true, 'ma': true, 'ya': true, 'ra': true, 'wa': true,
      'ga': true, 'za': true, 'da': true, 'ba': true, 'pa': true,
      'kya': true, 'sha': true, 'cha': true, 'nya': true, 'hya': true,
      'mya': true, 'rya': true, 'gya': true, 'ja': true, 'bya': true, 'pya': true
    }
  });
  
  // Initialiser le jeu avec sélection avancée
  const initializeGame = () => {
    let kanaToUse: Kana[] = [];
    
    // Filtrer en fonction des sélections de l'utilisateur
    if (advancedSelectionMode) {
      // Mode de sélection avancée
      const { hiragana, katakana, basic, dakuten, combined, groups } = selectedCategories;
      
      // Filtrer par type (hiragana/katakana)
      let filteredByType: Kana[] = [];
      if (hiragana) filteredByType = [...filteredByType, ...allHiragana];
      if (katakana) filteredByType = [...filteredByType, ...allKatakana];
      
      // Filtrer par catégorie (basic/dakuten/combined)
      let filteredByCategory = filteredByType.filter(kana => {
        // Déterminer la catégorie du kana
        const isBasic = !kana.romaji.includes('y') && 
                       !['ga', 'za', 'da', 'ba', 'pa', 'ji', 'zu', 'bi', 'pi'].includes(kana.romaji);
        const isDakuten = ['g', 'z', 'd', 'b', 'p'].some(c => kana.romaji.startsWith(c)) || 
                         ['ji', 'zu'].includes(kana.romaji);
        const isCombined = kana.romaji.includes('y') || 
                          ['sha', 'chi', 'tsu', 'cha', 'ja'].includes(kana.romaji);
        
        return (basic && isBasic) || (dakuten && isDakuten) || (combined && isCombined);
      });
      
      // Filtrer par groupe spécifique
      kanaToUse = filteredByCategory.filter(kana => {
        // Extraire le groupe du kana
        let group = kana.romaji.charAt(0) + 'a';
        if (kana.romaji.includes('y')) {
          // Pour les combinés comme kya, sha, etc.
          const base = kana.romaji.substring(0, kana.romaji.indexOf('y'));
          group = base + 'ya';
        } else if (['shi', 'chi', 'tsu'].includes(kana.romaji)) {
          // Cas spéciaux
          if (kana.romaji === 'shi') group = 'sha';
          if (kana.romaji === 'chi') group = 'cha';
        }
        
        return groups[group] || false;
      });
    } else {
      // Mode de sélection simple (existant)
      switch (selectedType) {
        case 'hiragana':
          kanaToUse = [...allHiragana];
          break;
        case 'katakana':
          kanaToUse = [...allKatakana];
          break;
        case 'both':
          kanaToUse = [...allKana];
          break;
      }
    }
    
    // Vérifier s'il y a des kana sélectionnés
    if (kanaToUse.length === 0) {
      alert("Veuillez sélectionner au moins un groupe de kana à réviser.");
      return;
    }
    
    // Mélanger aléatoirement
    const shuffled = [...kanaToUse].sort(() => Math.random() - 0.5);
    
    setKanaSet(shuffled);
    setCurrentKanaIndex(0);
    setWrongKana([]);
    setInput('');
    setFeedback(null);
    setIsReviewMode(false);
    setGameStarted(true);
    setStartTime(Date.now());
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };
  
  // Réinitialiser le chronomètre quand on passe à un nouveau kana
  useEffect(() => {
    if (gameStarted) {
      setStartTime(Date.now());
      setShowResponseTime(false);
    }
  }, [currentKanaIndex, gameStarted]);
  
  // Vérifier la réponse de l'utilisateur
  const checkAnswer = () => {
    const currentKana = isReviewMode ? wrongKana[currentKanaIndex] : kanaSet[currentKanaIndex];
    const isCorrect = input.toLowerCase().trim() === currentKana.romaji.toLowerCase();
    const currentTime = Date.now();
    
    if (isCorrect) {
      setFeedback('correct');
      
      // Calculer le temps de réponse
      if (startTime) {
        const time = (currentTime - startTime) / 1000; // en secondes
        setResponseTime(time);
        setShowResponseTime(true);
      }
      
      // Animation de transition
      setTimeout(() => {
        setInput('');
        setFeedback(null);
        setShowResponseTime(false);
        goToNextKana();
      }, animationDuration); // Utiliser la durée choisie par l'utilisateur
    } else {
      setFeedback('incorrect');
      
      // Ajouter à la liste des kana à réviser s'il n'est pas déjà présent
      if (!isReviewMode) {
        const currentKana = kanaSet[currentKanaIndex];
        if (!wrongKana.some(k => k.character === currentKana.character)) {
          setWrongKana(prev => [...prev, currentKana]);
        }
      }
      
      // Effacer l'entrée et passer au suivant automatiquement
      setTimeout(() => {
        setInput('');
        setFeedback(null);
        goToNextKana();
      }, Math.min(800, animationDuration / 2)); // Durée plus courte pour les erreurs
    }
  };
  
  // Passer au prochain kana
  const goToNextKana = () => {
    if (isReviewMode) {
      const nextIndex = currentKanaIndex + 1;
      
      if (nextIndex >= wrongKana.length) {
        // Tous les kana en mode révision ont été vus
        // Commencer une nouvelle session avec uniquement les kana manqués
        if (wrongKana.length > 0) {
          setKanaSet([...wrongKana]);
          setWrongKana([]);
          setCurrentKanaIndex(0);
          setIsReviewMode(false);
        } else {
          // Pas de kana manqués, finir la session
          setIsReviewMode(false);
          setCurrentKanaIndex(0);
        }
      } else {
        // Passer au prochain kana en mode révision
        setCurrentKanaIndex(nextIndex);
      }
    } else {
      // Mode normal
      const nextIndex = currentKanaIndex + 1;
      
      if (nextIndex >= kanaSet.length) {
        // Si tous les kana ont été présentés
        if (wrongKana.length > 0) {
          // S'il y a des erreurs, passez en mode révision
          setIsReviewMode(true);
          setCurrentKanaIndex(0);
        } else {
          // Sinon, réinitialisez pour une nouvelle partie
          initializeGame();
        }
      } else {
        // Sinon, passez au prochain kana
        setCurrentKanaIndex(nextIndex);
      }
    }
  };
  
  // Gérer la soumission du formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      checkAnswer();
    }
  };
  
  // Afficher le kana courant
  const getCurrentKana = (): Kana | null => {
    if (!gameStarted) return null;
    return isReviewMode ? wrongKana[currentKanaIndex] : kanaSet[currentKanaIndex];
  };
  
  // Le nombre total de kana à pratiquer
  const getTotalCount = (): number => {
    return isReviewMode ? wrongKana.length : kanaSet.length;
  };
  
  // Le nombre de kana déjà traités
  const getProgress = (): number => {
    if (isReviewMode) {
      return wrongKana.length > 0 ? Math.round((currentKanaIndex / wrongKana.length) * 100) : 0;
    } else {
      return kanaSet.length > 0 ? Math.round((currentKanaIndex / kanaSet.length) * 100) : 0;
    }
  };
  
  const currentKana = getCurrentKana();
  
  // Style pour le kana basé sur la police sélectionnée
  const kanaFontStyle = selectedFont === 'sans' 
    ? { fontFamily: 'var(--font-noto-sans-jp)' } 
    : { fontFamily: 'var(--font-noto-serif-jp)' };
  
  // Toggle la sélection d'une catégorie
  const toggleCategory = (category: string, value: boolean) => {
    setSelectedCategories(prev => ({
      ...prev,
      [category]: value
    }));
  };
  
  // Toggle la sélection d'un groupe
  const toggleGroup = (group: string) => {
    setSelectedCategories(prev => ({
      ...prev,
      groups: {
        ...prev.groups,
        [group]: !prev.groups[group]
      }
    }));
  };
  
  // Sélectionner tous les groupes d'une catégorie
  const selectAllInCategory = (category: string) => {
    // Définir quels groupes appartiennent à quelle catégorie
    const basicGroups = ['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa'];
    const dakutenGroups = ['ga', 'za', 'da', 'ba', 'pa'];
    const combinedGroups = ['kya', 'sha', 'cha', 'nya', 'hya', 'mya', 'rya', 'gya', 'ja', 'bya', 'pya'];
    
    let groupsToToggle: string[] = [];
    
    if (category === 'basic') groupsToToggle = basicGroups;
    else if (category === 'dakuten') groupsToToggle = dakutenGroups;
    else if (category === 'combined') groupsToToggle = combinedGroups;
    
    const newValue = !selectedCategories[category as keyof typeof selectedCategories];
    
    setSelectedCategories(prev => {
      const newGroups = {...prev.groups};
      groupsToToggle.forEach(group => {
        newGroups[group] = newValue;
      });
      
      return {
        ...prev,
        [category]: newValue,
        groups: newGroups
      };
    });
  };
  
  // Définition des groupes avec leurs exemples
  const kanaGroups = {
    basic: [
      { id: 'a', romaji: 'a', hiragana: 'あ', katakana: 'ア' },
      { id: 'ka', romaji: 'ka', hiragana: 'か', katakana: 'カ' },
      { id: 'sa', romaji: 'sa', hiragana: 'さ', katakana: 'サ' },
      { id: 'ta', romaji: 'ta', hiragana: 'た', katakana: 'タ' },
      { id: 'na', romaji: 'na', hiragana: 'な', katakana: 'ナ' },
      { id: 'ha', romaji: 'ha', hiragana: 'は', katakana: 'ハ' },
      { id: 'ma', romaji: 'ma', hiragana: 'ま', katakana: 'マ' },
      { id: 'ya', romaji: 'ya', hiragana: 'や', katakana: 'ヤ' },
      { id: 'ra', romaji: 'ra', hiragana: 'ら', katakana: 'ラ' },
      { id: 'wa', romaji: 'wa', hiragana: 'わ', katakana: 'ワ' }
    ],
    dakuten: [
      { id: 'ga', romaji: 'ga', hiragana: 'が', katakana: 'ガ' },
      { id: 'za', romaji: 'za', hiragana: 'ざ', katakana: 'ザ' },
      { id: 'da', romaji: 'da', hiragana: 'だ', katakana: 'ダ' },
      { id: 'ba', romaji: 'ba', hiragana: 'ば', katakana: 'バ' },
      { id: 'pa', romaji: 'pa', hiragana: 'ぱ', katakana: 'パ' }
    ],
    combined: [
      { id: 'kya', romaji: 'kya', hiragana: 'きゃ', katakana: 'キャ' },
      { id: 'sha', romaji: 'sha', hiragana: 'しゃ', katakana: 'シャ' },
      { id: 'cha', romaji: 'cha', hiragana: 'ちゃ', katakana: 'チャ' },
      { id: 'nya', romaji: 'nya', hiragana: 'にゃ', katakana: 'ニャ' },
      { id: 'hya', romaji: 'hya', hiragana: 'ひゃ', katakana: 'ヒャ' },
      { id: 'mya', romaji: 'mya', hiragana: 'みゃ', katakana: 'ミャ' },
      { id: 'rya', romaji: 'rya', hiragana: 'りゃ', katakana: 'リャ' },
      { id: 'gya', romaji: 'gya', hiragana: 'ぎゃ', katakana: 'ギャ' },
      { id: 'ja', romaji: 'ja', hiragana: 'じゃ', katakana: 'ジャ' },
      { id: 'bya', romaji: 'bya', hiragana: 'びゃ', katakana: 'ビャ' },
      { id: 'pya', romaji: 'pya', hiragana: 'ぴゃ', katakana: 'ピャ' }
    ]
  };
  
  return (
      <main className={styles.main}>
      {!gameStarted ? (
        <div className={styles.startScreen}>
          <h1 className={styles.title}>Kana Practice</h1>
          <p className={styles.description}>
            Révisez tous les hiragana et katakana en les écrivant en romaji.
          </p>
          
          <div className={styles.options}>
            <div className={styles.selectionToggle}>
              <button 
                className={`${styles.tabButton} ${!advancedSelectionMode ? styles.active : ''}`}
                onClick={() => setAdvancedSelectionMode(false)}
              >
                Sélection simple
              </button>
              <button 
                className={`${styles.tabButton} ${advancedSelectionMode ? styles.active : ''}`}
                onClick={() => setAdvancedSelectionMode(true)}
              >
                Sélection avancée
              </button>
            </div>
            
            {!advancedSelectionMode ? (
              <>
                <h2>Que voulez-vous pratiquer ?</h2>
                
                <div className={styles.buttons}>
                  <button 
                    className={`${styles.optionButton} ${selectedType === 'hiragana' ? styles.selected : ''}`}
                    onClick={() => setSelectedType('hiragana')}
                  >
                    Hiragana
                  </button>
                  
                  <button 
                    className={`${styles.optionButton} ${selectedType === 'katakana' ? styles.selected : ''}`}
                    onClick={() => setSelectedType('katakana')}
                  >
                    Katakana
                  </button>
                  
                  <button 
                    className={`${styles.optionButton} ${selectedType === 'both' ? styles.selected : ''}`}
                    onClick={() => setSelectedType('both')}
                  >
                    Les deux
                  </button>
                </div>
                
                <h2>Choisissez une police d'affichage</h2>
                
                <div className={styles.buttons}>
                  <button 
                    className={`${styles.optionButton} ${selectedFont === 'sans' ? styles.selected : ''}`}
                    onClick={() => setSelectedFont('sans')}
                  >
                    <span style={{ fontFamily: 'var(--font-noto-sans-jp)' }}>
                      あア Noto Sans JP
                    </span>
                  </button>
                  
                  <button 
                    className={`${styles.optionButton} ${selectedFont === 'serif' ? styles.selected : ''}`}
                    onClick={() => setSelectedFont('serif')}
                  >
                    <span style={{ fontFamily: 'var(--font-noto-serif-jp)' }}>
                      あア Noto Serif JP
                    </span>
                  </button>
                </div>
                
                <h2>Temps d'animation entre les kana ({animationDuration} ms)</h2>
                
                <div className={styles.sliderContainer}>
                  <input
                    type="range"
                    min="500"
                    max="3000"
                    step="100"
                    value={animationDuration}
                    onChange={(e) => setAnimationDuration(parseInt(e.target.value))}
                    className={styles.slider}
                  />
                  <div className={styles.sliderLabels}>
                    <span>Rapide</span>
                    <span>Lent</span>
                  </div>
                </div>
              </>
            ) : (
              <div className={styles.advancedSelection}>
                <div className={styles.categorySection}>
                  <h2>Types de Kana</h2>
                  <div className={styles.categoryButtons}>
                    <button 
                      className={`${styles.categoryButton} ${selectedCategories.hiragana ? styles.selected : ''}`}
                      onClick={() => toggleCategory('hiragana', !selectedCategories.hiragana)}
                    >
                      <div className={styles.categoryLabel}>Hiragana</div>
                      <div className={styles.categoryExample}>あ い う え お</div>
                    </button>
                    <button 
                      className={`${styles.categoryButton} ${selectedCategories.katakana ? styles.selected : ''}`}
                      onClick={() => toggleCategory('katakana', !selectedCategories.katakana)}
                    >
                      <div className={styles.categoryLabel}>Katakana</div>
                      <div className={styles.categoryExample}>ア イ ウ エ オ</div>
                    </button>
                  </div>
                </div>
                
                <div className={styles.categorySection}>
                  <h2>Catégories</h2>
                  <div className={styles.categoryButtons}>
                    <button 
                      className={`${styles.categoryButton} ${selectedCategories.basic ? styles.selected : ''}`}
                      onClick={() => selectAllInCategory('basic')}
                    >
                      <div className={styles.categoryLabel}>Kana de base</div>
                      <div className={styles.categoryExample}>あ か さ た な</div>
                    </button>
                    <button 
                      className={`${styles.categoryButton} ${selectedCategories.dakuten ? styles.selected : ''}`}
                      onClick={() => selectAllInCategory('dakuten')}
                    >
                      <div className={styles.categoryLabel}>Kana avec dakuten</div>
                      <div className={styles.categoryExample}>が ざ だ ば ぱ</div>
                    </button>
                    <button 
                      className={`${styles.categoryButton} ${selectedCategories.combined ? styles.selected : ''}`}
                      onClick={() => selectAllInCategory('combined')}
                    >
                      <div className={styles.categoryLabel}>Kana combinés</div>
                      <div className={styles.categoryExample}>きゃ しゃ ちゃ</div>
                    </button>
                  </div>
                </div>
                
                <div className={styles.groupsContainer}>
                  <div className={styles.groupSection}>
                    <h3>Kana de base</h3>
                    <div className={styles.groupButtons}>
                      {kanaGroups.basic.map(group => {
                        const kanaToShow = selectedCategories.hiragana ? group.hiragana : (
                          selectedCategories.katakana ? group.katakana : group.hiragana
                        );
                        
                        return (
                          <button
                            key={group.id}
                            className={`${styles.groupButton} ${selectedCategories.groups[group.id] ? styles.selected : ''}`}
                            onClick={() => toggleGroup(group.id)}
                          >
                            <div className={styles.kanaChar}>{kanaToShow}</div>
                            <div className={styles.romajiChar}>{group.romaji}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className={styles.groupSection}>
                    <h3>Avec dakuten</h3>
                    <div className={styles.groupButtons}>
                      {kanaGroups.dakuten.map(group => {
                        const kanaToShow = selectedCategories.hiragana ? group.hiragana : (
                          selectedCategories.katakana ? group.katakana : group.hiragana
                        );
                        
                        return (
                          <button
                            key={group.id}
                            className={`${styles.groupButton} ${selectedCategories.groups[group.id] ? styles.selected : ''}`}
                            onClick={() => toggleGroup(group.id)}
                          >
                            <div className={styles.kanaChar}>{kanaToShow}</div>
                            <div className={styles.romajiChar}>{group.romaji}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className={styles.groupSection}>
                    <h3>Combinés</h3>
                    <div className={styles.groupButtons}>
                      {kanaGroups.combined.map(group => {
                        const kanaToShow = selectedCategories.hiragana ? group.hiragana : (
                          selectedCategories.katakana ? group.katakana : group.hiragana
                        );
                        
                        return (
                          <button
                            key={group.id}
                            className={`${styles.groupButton} ${selectedCategories.groups[group.id] ? styles.selected : ''}`}
                            onClick={() => toggleGroup(group.id)}
                          >
                            <div className={styles.kanaChar}>{kanaToShow}</div>
                            <div className={styles.romajiChar}>{group.romaji}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <button 
              className={styles.startButton}
              onClick={() => initializeGame()}
            >
              Commencer
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.header}>
            <button className={styles.homeButton} onClick={() => setGameStarted(false)}>
              Menu
            </button>
            
            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${getProgress()}%` }}
                />
              </div>
              <div className={styles.progressText}>
                {isReviewMode ? 'Révision' : `${currentKanaIndex}/${kanaSet.length}`}
                {isReviewMode && ` - ${wrongKana.length} restants`}
              </div>
            </div>
          </div>
          
          {currentKana && (
            <div className={`${styles.kanaContainer} ${feedback ? styles[feedback] : ''}`}>
              <div className={styles.kana} style={kanaFontStyle}>
                {currentKana.character}
              </div>
              
              {showResponseTime && responseTime !== null && (
                <div className={styles.responseTime}>
                  Temps: {responseTime.toFixed(2)}s
                </div>
              )}
              
              <form onSubmit={handleSubmit} className={styles.inputForm}>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  className={styles.input}
                  placeholder="Romaji..."
                  autoComplete="off"
                  autoCapitalize="none"
                />
                <button type="submit" className={styles.submitButton}>
                  Vérifier
                </button>
              </form>
    </div>
          )}
        </>
      )}
    </main>
  );
}
