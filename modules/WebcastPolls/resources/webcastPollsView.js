(function (mw, $) {
    "use strict";
    mw.webcastPolls = mw.webcastPolls || {};

    mw.webcastPolls.WebcastPollsView = mw.KBasePlugin.extend({
        defaultConfig: {
        },
        setup : function()
        {
            var _this = this;
            _this.addBindings();
        },
        addBindings : function()
        {
            var _this = this;

            this.bind( 'updateLayout', function(event, data) {
                _this._handleLayout();
            });
        },
        parent: {}, // ## This object will be assigned by the container
        $webcastPoll: null,
        locale: {
            respondsLbl: gM('mwe-webc-polls-respondsLbl')
        },
        _currentViewType: '',
        getWebcastPollElement: function () {
            var _this = this;

            if (_this.$webcastPoll) {
                return _this.$webcastPoll;
            }

            try {
                if (_this.getPlayer() && _this.getPlayer().getVideoHolder()) {
                    var $poll = $('<div></div>').addClass("webcastPolls");
                    _this.$webcastPoll = $poll;
                    _this.getPlayer().getVideoHolder().append(_this.$webcastPoll);

                    _this._handleLayout();
                }
            } catch (e) {
                _this.$webcastPoll = null;
            }

            return (_this.$webcastPoll && _this.$webcastPoll.length) ? true : false;
        },
        isMobile: function () {
            // TODO [es]
        },
        _getLayoutName: function () {
            var _this = this;
            
            var pollViewPortWidth = _this.$webcastPoll ? _this.$webcastPoll.width() : null;
            var pollViewPortHeight = _this.$webcastPoll ? _this.$webcastPoll.height() : null;
            var result = '';
            if (pollViewPortHeight < 375 || pollViewPortWidth < 670) {
                result = 'small';
            } else if (pollViewPortHeight < 576) {
                result = 'medium';
            } else {
                result = 'large';
            }

            mw.log('webcastPollsView._getLayoutName(): resulted with ' + result);
            return result;
        },
        _handleLayout: function () {
            var _this = this;

            if (_this.$webcastPoll) {
                var targetLayoutName = _this._getLayoutName();

                if (_this._currentViewType !== targetLayoutName) {
                    _this.$webcastPoll.empty();

                    try {
                        var pollRawLayoutHTML = '';

                        if (targetLayoutName){
                            var templateName = '../WebcastPolls/resources/webcastPolls-' + targetLayoutName + '.tmpl.html';
                            pollRawLayoutHTML = (window && window.kalturaIframePackageData && window.kalturaIframePackageData.templates) ? window.kalturaIframePackageData.templates[templateName] : '';
                        }

                        var $pollLayout = $(pollRawLayoutHTML);
                        $pollLayout.find('.answer').click($.proxy(_this.parent.handleAnswerClicked, _this.parent));
                        _this.$webcastPoll.append($pollLayout);


                        _this._currentViewType = targetLayoutName;
                        _this.syncPollDOM();
                    } catch (e) {
                        // TODO [es]
                        _this.$webcastPoll.empty();
                    }
                }
            }
        },
        removeWebcastPollElement: function () {
            var _this = this;
            if (_this.$webcastPoll) {
                _this.$webcastPoll.remove();
                _this.$webcastPoll = null;
            }

            _this._currentViewType = null;
        },
        syncDOMPollResults: function () {
            var _this = this;

            function updateAnswerResult(answerIndex, showResults, pollResults, popularAnswers) {

                if (showResults && pollResults ) {

                    var answerContent = !isNaN(pollResults.answers[answerIndex + ''])?  (+pollResults.answers[answerIndex + '']) : 0;
                    var isPopularAnswer = popularAnswers.split(',').indexOf(answerIndex + '') !== -1;
                    var totalVoters = !isNaN(pollResults.totalVoters) ? (+pollResults.totalVoters) : 0;
                    var answerPercentage = totalVoters > 0 ? Math.round(answerContent / totalVoters * 100) : 0;

                    if (isPopularAnswer) {
                        _this.$webcastPoll.find('[name="answer' + answerIndex + '"]').closest('.answer').addClass('popular');
                    }else
                    {
                        _this.$webcastPoll.find('[name="answer' + answerIndex + '"]').closest('.answer').removeClass('popular');
                    }

                    _this.$webcastPoll.find('[name="answer' + answerIndex + 'Result"]').css('width',answerPercentage + '%');
                    _this.$webcastPoll.find('[name="answer' + answerIndex + 'ResultText"]').text(answerPercentage + '%');

                } else {
                    _this.$webcastPoll.find('[name="answer' + answerIndex + '"]').closest('.answer').removeClass('popular');
                    _this.$webcastPoll.find('[name="answer' + answerIndex + 'Result"]').css('width','0%');
                    _this.$webcastPoll.find('[name="answer' + answerIndex + 'ResultText"]').text('');
                }
            }

            if (_this.$webcastPoll) {
                var $totalsContainer = _this.$webcastPoll.find("[name='totals']");

                if ($totalsContainer) {
                    var pollResults = _this.parent.pollData.pollResults;
                    var hasPollContent = _this.parent.pollData.content;
                    var showTotals = _this.parent.pollData.showTotals;
                    var showResults = _this.parent.pollData.showResults;

                    if ( hasPollContent && pollResults )
                    {
                        var popularAnswers = '';
                        var popularValue = 0;

                        if (showResults) {
                            for (var propertyName in pollResults.answers) {
                                var answerValue = pollResults.answers[propertyName];
                                if (answerValue) { // make sure that 0 will not be marked as popular value
                                    if (answerValue > popularValue) {
                                        popularAnswers = propertyName;
                                        popularValue = answerValue;
                                    }
                                    else if (answerValue === popularValue) {
                                        popularAnswers = popularAnswers ? (popularAnswers + ',' + propertyName) : propertyName;
                                    }
                                }
                            }
                        }

                        updateAnswerResult(1,showResults, pollResults, popularAnswers);
                        updateAnswerResult(2,showResults, pollResults, popularAnswers);
                        updateAnswerResult(3,showResults, pollResults, popularAnswers);
                        updateAnswerResult(4,showResults, pollResults, popularAnswers);
                        updateAnswerResult(5,showResults, pollResults, popularAnswers);

                        if (showTotals && pollResults.totalVoters) {
                            var label = '';

                            if (pollResults.totalVoters && !isNaN(pollResults.totalVoters))
                            {
                                var totalVotersAsNumber = parseInt(pollResults.totalVoters);
                                if (totalVotersAsNumber && totalVotersAsNumber > 10000) {
                                    label = (totalVotersAsNumber - (totalVotersAsNumber % 1000)) / 1000 + "K";
                                } else {
                                    label = pollResults.totalVoters;
                                }
                                $totalsContainer.find("[name='value']").text(label);
                                $totalsContainer.find("[name='text']").text(totalVotersAsNumber === 1 ? 'Response' : 'Responses');
                                $totalsContainer.css('opacity', '1');
                            }else {
                                $totalsContainer.css('opacity', '0');
                            }
                        } else {
                            $totalsContainer.css('opacity', '0');
                        }
                    }else
                    {
                        $totalsContainer.css('opacity', '0');
                        updateAnswerResult(1, false);
                        updateAnswerResult(2, false);
                        updateAnswerResult(3, false);
                        updateAnswerResult(4, false);
                        updateAnswerResult(5, false);
                    }

                }
            }
        },
        syncDOMUserVoting: function () {
            var _this = this;
            if (_this.$webcastPoll) {
                var pollContent = _this.parent.pollData.content;

                if (pollContent) {
                    var selectedAnswerSelector = '[name="answer' + _this.parent.userVote.answer + '"]';

                    _this.$webcastPoll.find('.answer').not('.answer>' + selectedAnswerSelector).removeClass('selected');

                    if (_this.parent.userVote.answer) {
                        _this.$webcastPoll.find(selectedAnswerSelector).closest('.answer').addClass('selected');
                    }

                    if (_this.parent.canUserVote()) {
                        _this.$webcastPoll.addClass('allow-voting');
                    } else {
                        _this.$webcastPoll.removeClass('allow-voting');
                    }
                }

            }
        },
        syncDOMAnswersVisibility : function()
        {
            var _this = this;

            if (_this.parent.pollData.showAnswers)
            {
                _this.showPollDOMContent();
            }else
            {
                _this.showPollDOMQuestionOnly();
            }
        },
        syncPollDOM: function () {
            var _this = this;

            function updateAnswer(answerIndex, pollData) {
                var answerContent = pollData.answers[answerIndex + ''];
                if (answerContent) {
                    _this.$webcastPoll.find('[name="answer' + answerIndex + '"]').text(answerContent).closest('.answer').show();
                } else {
                    _this.$webcastPoll.find('[name="answer' + answerIndex + '"]').closest('.answer').hide();
                }
            }

            if (_this.parent.pollData.pollId) {
                // ## should check that requested poll is shown

                // Make sure we have a container
                if (!_this.$webcastPoll) {
                    _this.$webcastPoll = _this.getWebcastPollElement();
                }

                if (_this.parent.pollData.errorContent)
                {
                    _this.showPollDOMError();
                }else {
                    var pollContent = _this.parent.pollData.content;

                    if (pollContent) {

                        var numberOfAnswers = 0;
                        $.each(pollContent.answers, function(key, element) {
                            numberOfAnswers++;
                        });

                        _this.$webcastPoll.addClass('poll-size-' + numberOfAnswers);

                        _this.$webcastPoll.find('[name="question"]').text(pollContent.question);
                        updateAnswer(1, pollContent);
                        updateAnswer(2, pollContent);
                        updateAnswer(3, pollContent);
                        updateAnswer(4, pollContent);
                        updateAnswer(5, pollContent);

                        _this.syncDOMAnswersVisibility();

                    } else {
                        _this.$webcastPoll.find('[name="question"],[name="answer1"],[name="answer2"],[name="answer3"],[name="answer4"],[name="answer5"]').text('');
                        _this.showPollDOMLoader();
                    }

                    _this.syncDOMPollResults();
                    _this.syncDOMUserVoting();
                }


            } else {
                // ## should hide poll if any is shown
            }
        },
        showPollDOMLoader: function () {
            var _this = this;
            if (_this.$webcastPoll) {
                _this.$webcastPoll.find('[name="pollContent"]').hide();
                _this.$webcastPoll.find('[name="questionOnlyContainer"]').hide();
                _this.$webcastPoll.find('[name="errorContainer"]').hide();
                _this.$webcastPoll.find('[name="loadingContainer"]').show();
            }
        },
        showPollDOMError: function () {
            var _this = this;
            if (_this.$webcastPoll) {
                _this.$webcastPoll.find('[name="pollContent"]').hide();
                _this.$webcastPoll.find('[name="questionOnlyContainer"]').hide();
                _this.$webcastPoll.find('[name="loadingContainer"]').hide();
                _this.$webcastPoll.find('[name="errorContainer"]').fadeIn('slow');
            }
        },
        showPollDOMQuestionOnly: function () {
            var _this = this;

            if (_this.$webcastPoll) {
                _this.$webcastPoll.find('[name="loadingContainer"]').hide();
                _this.$webcastPoll.find('[name="pollContent"]').hide();
                _this.$webcastPoll.find('[name="errorContainer"]').hide();
                _this.$webcastPoll.find('[name="questionOnlyContainer"]').fadeIn('slow');
            }
        },
        showPollDOMContent: function () {
            var _this = this;

            if (_this.$webcastPoll) {
                _this.$webcastPoll.find('[name="loadingContainer"]').hide();
                _this.$webcastPoll.find('[name="questionOnlyContainer"]').hide();
                _this.$webcastPoll.find('[name="errorContainer"]').hide();
                _this.$webcastPoll.find('[name="pollContent"]').fadeIn('slow');
            }
        }

    });

})(window.mw, window.jQuery);
