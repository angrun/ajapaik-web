(function () {
    'use strict';
    /*jslint nomen: true*/
    /*jslint browser: true*/
    /*global streamURL*/
    /*global difficultyFeedbackURL*/
    /*global gameURL*/
    /*global mapURL*/
    /*global isMobile*/
    /*global _gaq*/
    /*global google*/
    /*global docCookies*/
    var currentPhoto,
        lastStatusMessage,
        photoLoadModalResizeFunction,
        modalPhoto = $('#ajp-game-modal-photo'),
        previousButtons = $('.ajp-game-previous-photo-button'),
        fullScreenImage = $('#ajp-fullscreen-image'),
        nextPhotoLoading = false;
    window.locationToolsOpen = false;
    window.photoHistory = [];
    window.descriptionViewHistory = {};
    window.photoHistoryIndex = null;
    window.startSuggestionLocation = function () {
        let startLat = 59;
        let startLon = 26;
        $('#ajp-map-container').hide();
        $('#ajp-game-photo-modal').hide();
        $('.modal-backdrop').hide();
        if (currentPhoto.lat && currentPhoto.lon) {
            startLat = currentPhoto.lat;
            startLon = currentPhoto.lon;
        } else if (window.startLocation[0] && window.startLocation[1]) {
            startLat = window.startLocation[1];
            startLon = window.startLocation[0];
        }
        $('#ajp-geotagging-container').show().data('AjapaikGeotagger').initializeGeotaggerState({
            thumbSrc: '/photo-thumb/' + currentPhoto.id + '/400/',
            photoFlipped: currentPhoto.flip,
            fullScreenSrc: currentPhoto.large.url,
            description: currentPhoto.description,
            sourceKey: currentPhoto.sourceKey,
            sourceName: currentPhoto.sourceName,
            sourceURL: currentPhoto.sourceURL,
            startLat: startLat,
            startLng: startLon,
            photoId: currentPhoto.id,
            uniqueGeotagCount: currentPhoto.totalGeotags,
            uniqueGeotagWithAzimuthCount: currentPhoto.geotagsWithAzimuth,
            mode: 'vantage',
            markerLocked: true,
            isGame: true,
            isMapview: false,
            isGallery: false,
            tutorialClosed: docCookies.getItem('ajapaik_closed_geotagger_instructions') === 'true',
            hintUsed: window.gameHintUsed
        });
        $('body').css('overflow', 'auto');
        window.locationToolsOpen = true;
        window.syncStateToUrl();
    };
    window.stopSuggestionLocation = function () {
        $('#ajp-map-container').show();
        $('#ajp-game-photo-modal').show();
        $('.modal-backdrop').show();
        $('#ajp-geotagging-container').hide();
        $('body').css('overflow', 'hidden');
        window.nextPhoto();
        window.locationToolsOpen = false;
        window.syncStateToUrl();
    };
    window.syncStateToUrl = function () {
        var currentUrl = window.URI(window.location.href);
        currentUrl.removeSearch('album').removeSearch('photo').removeSearch('area').removeSearch('locationToolsOpen');
        if (window.albumId) {
            currentUrl.addSearch('album', window.albumId);
        }
        if (currentPhoto) {
            currentUrl.addSearch('photo', currentPhoto.id);
        }
        if (window.areaId) {
            currentUrl.addSearch('area', window.areaId);
        }
        if (window.locationToolsOpen) {
            currentUrl.addSearch('locationToolsOpen', 1);
        }
        window.history.replaceState(null, window.title, currentUrl);
    };
    // For displaying the small map correctly in the modal
    photoLoadModalResizeFunction = function () {
        $('#ajp-photo-modal-map-container').css('max-height', window.outerHeight / 2 + 'px');
        $('#ajp-game-modal-photo').css('max-height', window.outerHeight / 2 + 'px');
        window.showPhotoMapIfApplicable();
    };
    window.nextPhoto = function (previous) {
        nextPhotoLoading = true;
        modalPhoto.unbind('load');
        window.hideDescriptions();
        window.hideDescriptionButtons();
        var request = {
            b: new Date().getTime()
        };
        if (window.preselectedPhotoId) {
            request.photo = window.preselectedPhotoId;
            window.preselectedPhotoId = null;
        } else {
            // User wants to go back or not
            if (previous) {
                // We can only go back if we have history and we haven't reached the beginning
                if (window.photoHistory.length > 0 && window.photoHistoryIndex >= 0) {
                    // Move back 1 step, don't go to -1
                    if (window.photoHistoryIndex > 0) {
                        window.photoHistoryIndex -= 1;
                    }
                    // Get the photo id to load from history
                    request.photo = window.photoHistory[window.photoHistoryIndex];
                }
            } else {
                // There's no history or we've reached the end, load a new photo
                if (window.photoHistory.length === 0 || window.photoHistoryIndex === (window.photoHistory.length - 1)) {
                    if (window.albumId) {
                        request.album = window.albumId;
                    } else if (window.areaId) {
                        request.area = window.areaId;
                    }
                } else {
                    // There's history and we haven't reached the end
                    window.photoHistoryIndex += 1;
                    request.photo = window.photoHistory[window.photoHistoryIndex];
                }
            }
        }
        if (window.photoHistory.length > 0 && window.photoHistoryIndex > 0) {
            previousButtons.removeClass('ajp-photo-modal-previous-button-disabled');
        } else {
            previousButtons.addClass('ajp-photo-modal-previous-button-disabled');
        }
        // TODO: Why not POST?
        if (request.photo || request.album || request.area) {
            $.getJSON(streamURL, request, function (data) {
                var textTarget = $('#ajp-game-status-message'),
                    message,
                    descStatus;
                textTarget.hide();
                currentPhoto = data.photo;
                var likeButton = $('.ajp-like-photo-overlay-button');
                if (currentPhoto.userLikes) {
                    likeButton.addClass('active').removeClass('big');
                    likeButton.find('.material-icons').html('favorite');
                } else if (currentPhoto.userLoves) {
                    likeButton.addClass('active big');
                    likeButton.find('.material-icons').html('favorite');
                } else {
                    likeButton.removeClass('active big');
                    likeButton.find('.material-icons').html('favorite_border');
                }
                likeButton.find('.ajp-like-count').html(currentPhoto.userLikeCount);
                descStatus = window.descriptionViewHistory[currentPhoto.id];
                // Remove JS-breaking formatting if some has snuck in
                currentPhoto.description = currentPhoto.description.replace(/(\r\n|\n|\r)/gm, '');
                if (currentPhoto.description) {
                    window.showDescriptionButtons();
                } else {
                    window.hideDescriptionButtons();
                }
                $('#ajp-game-photo-description').text(currentPhoto.description);
                $('#ajp-game-source-link').attr('href', currentPhoto.sourceURL)
                    .text(currentPhoto.sourceName + ' ' + currentPhoto.sourceKey);
                if (descStatus) {
                    window.showDescriptions();
                    window.hideDescriptionButtons();
                } else {
                    window.gameHintUsed = false;
                }
                // Not a history request
                if (!request.photo || window.preselectedPhotoId) {
                    window.photoHistory.push(currentPhoto.id);
                    window.photoHistoryIndex = window.photoHistory.length - 1;
                    window.preselectPhotoId = null;
                }
                if (data.nothingMoreToShow) {
                    message = window.gettext("You've seen all the pictures in this album, we are now showing you random photos.");
                } else if (data.userSeenAll) {
                    message = window.gettext('You have seen all the pictures from this album.');
                }
                if (message !== lastStatusMessage) {
                    textTarget.html(message);
                    textTarget.show();
                }
                lastStatusMessage = message;
                let photoUrl = currentPhoto.big.url;

                if (window.previouslyEditedPhotoIds && window.previouslyEditedPhotoIds.includes(currentPhoto.id.toString())) {
                    photoUrl += '?timestamp=' + Date.now();
                }
                modalPhoto.attr('src', photoUrl).attr('alt', currentPhoto.description);

                // For mini-map
                window.photoModalGeotaggingUserCount = currentPhoto.totalGeotags;
                window.photoModalPhotoLat = currentPhoto.lat;
                window.photoModalPhotoLng = currentPhoto.lon;
                window.photoModalPhotoAzimuth = currentPhoto.azimuth;
                window.currentlyOpenPhotoId = currentPhoto.id;
                window.photoModalUserHasConfirmedThisLocation = !!currentPhoto.userAlreadyConfirmed;
                window.photoModalUserHasGeotaggedThisPhoto = !!currentPhoto.userAlreadyGeotagged;
                if (!window.isMobile) {
                    modalPhoto.on('load', photoLoadModalResizeFunction);
                }
                if (window.fullscreenEnabled) {
                    fullScreenImage.attr('src', currentPhoto.large.url).attr('data-src', currentPhoto.large.url).attr('alt', currentPhoto.description)
                        .on('load', function () {
                        fullScreenImage.unbind('load');
                    });
                } else {
                    fullScreenImage.attr('data-src', currentPhoto.large.url).attr('alt', currentPhoto.description)
                        .on('load', function () {
                        fullScreenImage.unbind('load');
                    });
                }
                fullScreenImage.parent().removeClass('ajp-photo-flipped');
                modalPhoto.removeClass('ajp-photo-flipped');
                var azimuthIndicator = $('#ajp-photo-modal-location-with-azimuth'),
                    locationIndicator = $('#ajp-photo-modal-location-without-azimuth'),
                    noLocationIndicator = $('#ajp-photo-modal-no-location');
                if (currentPhoto.azimuth) {
                    azimuthIndicator.show();
                    locationIndicator.hide();
                    noLocationIndicator.hide();
                } else if (currentPhoto.lat && currentPhoto.lon) {
                    azimuthIndicator.hide();
                    locationIndicator.show();
                    noLocationIndicator.hide();
                } else {
                    azimuthIndicator.hide();
                    locationIndicator.hide();
                    noLocationIndicator.show();
                }
                if (currentPhoto.lat && currentPhoto.lon) {
                    window.map.setCenter(new google.maps.LatLng(currentPhoto.lat, currentPhoto.lon));
                }
                nextPhotoLoading = false;
                window.syncStateToUrl();
            });
        } else {
            nextPhotoLoading = false;
        }
    };

    window.showDescriptions = function () {
        window.gameHintUsed = true;
        window.descriptionViewHistory[currentPhoto.id] = true;
        $('#ajp-game-photo-description').show();
        $('#ajp-game-photo-identifier').show();
        _gaq.push(['_trackEvent', 'Game', 'Show description']);
    };
    window.showDescriptionButtons = function () {
        $('.ajp-game-show-description-button').show();
    };
    window.hideDescriptions = function () {
        $('#ajp-game-photo-description').hide();
        $('#ajp-game-photo-identifier').hide();
    };
    window.hideDescriptionButtons = function () {
        $('.ajp-game-show-description-button').hide();
        $('#ajp-game-full-screen-show-description-button').hide();
    };
    $(document).ready(function () {
        window.updateLeaderboard();
        $('#ajp-game-photo-modal').modal({
            backdrop: 'static',
            keyboard: false
        }).on('shown.bs.modal', function () {
            if (window.straightToSpecify) {
                $('#ajp-photo-modal-specify-location').click();
                $('.modal-backdrop').hide();
                window.straightToSpecify = false;
            }
            window.showPhotoMapIfApplicable();
        });
        if (!isMobile) {
            $('.ajp-show-similar-photo-selection-overlay-button').hide('fade',250);
        }
        $('#ajp-geotagging-container').AjapaikGeotagger();
        // FIXME: Only place coordinates are in reverse order
        let mapLocation = new google.maps.LatLng(window.startLocation[1], window.startLocation[0]);
        if (mapLocation) {
            window.getMap(mapLocation, 15, true);
        } else {
            window.getMap(undefined, undefined, true);
        }
        window.nextPhoto();
        window.handleAlbumChange = function () {
            if (window.albumId) {
                window.location.href = gameURL + '?album=' + window.albumId;
            }
        };
        $('#logout-button').click(function () {
            _gaq.push(['_trackEvent', 'Game', 'Logout']);
        });
        $('.ajp-game-specify-location-button').click(function () {
            _gaq.push(['_trackEvent', 'Game', 'Specify location mobile button']);
        });
        $(document).on('click', '#ajp-game-source-link', function () {
            _gaq.push(['_trackEvent', 'Game', 'Source link click']);
        });
        $(document).on('click', '.ajp-game-next-photo-button', function () {
            if (!nextPhotoLoading) {
                var data = {
                    photo_id: currentPhoto.id,
                    origin: 'Game',
                    csrfmiddlewaretoken: docCookies.getItem('csrftoken')
                };
                $.post(window.saveLocationURL, data, function () {
                    window.nextPhoto();
                });
                _gaq.push(['_trackEvent', 'Game', 'Next photo']);
            }
            window.photoModalCurrentPhotoFlipped = false;
            $('#ajp-game-flip-button').removeClass('active');
        });
        $(document).on('click', '.ajp-game-previous-photo-button', function () {
            if (!nextPhotoLoading && !$(this).hasClass('ajp-game-previous-photo-button-disabled')) {
                window.nextPhoto(true);
                _gaq.push(['_trackEvent', 'Game', 'Previous photo']);
            }
            window.photoModalCurrentPhotoFlipped = false;
            $('#ajp-game-flip-button').removeClass('active');
        });
        $(document).on('click', '#ajp-game-close-game-modal', function () {
            window.location.href = mapURL + '?album=' + window.albumId;
        });
        $(document).on('click', 'a.fullscreen', function (e) {
            e.preventDefault();
            if (window.BigScreen.enabled) {
                var div = $('#ajp-fullscreen-image-container'),
                    img = div.find('img');
                let previousUrl = img.attr('data-src');
                previousUrl = previousUrl.split('?timestamp')[0];
                if (window.previouslyEditedPhotoIds && window.previouslyEditedPhotoIds.includes(currentPhoto.id.toString())) {
                    img.attr('src', previousUrl + '?timestamp=' + Date.now());
                }
                img.attr('src', img.attr('data-src'));
                window.BigScreen.request(div[0]);
                $('#ajp-game-full-screen-flip-button').show();
                window.fullscreenEnabled = true;
                _gaq.push(['_trackEvent', 'Game', 'Full-screen']);
            }
        });
        $(document).on('click', '.ajp-game-show-description-button', function () {
            window.showDescriptions();
            window.hideDescriptionButtons();
        });
        $('#ajp-game-modal-body').hover(function () {
            if (!isMobile) {
                $('.ajp-show-similar-photo-selection-overlay-button').show('fade',250);
                $('.ajp-photo-modal-next-button').show();
                $('.ajp-photo-modal-previous-button').show();
                $('#ajp-game-flip-button').show();
            }
        }, function () {
            if (!isMobile && !window.fullscreenEnabled) {
                $('.ajp-show-similar-photo-selection-overlay-button').hide('fade',250);
                $('.ajp-photo-modal-next-button').hide();
                $('.ajp-photo-modal-previous-button').hide();
                $('#ajp-game-flip-button').hide();
            }
        });
        if (parseInt(window.getQueryParameterByName('locationToolsOpen'), 10) === 1) {
            window.straightToSpecify = true;
        }
    });
}());