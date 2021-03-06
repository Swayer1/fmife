//all angular code for our app 
// public/core.js
$(document).ready(function() {
	$('#toggleAdvanced').prop('checked', false);
	$('#advancedSearch').fadeOut(0);
	$('.success').fadeOut(0);
	$('.errors').fadeOut(0);
	$('#sortField').val('ByName');
	$('#sortOrder').val('Type');
	$('#pageSizeSelect').val('5');
	$('.custom-pagesize-value').val('');
});

$(window).resize(function () {
	togglePopovers();
});

var fmiFe = angular.module('fmiFe', []);

angular.module('fmiFe').filter('pagination', function() {
	return function(input, start)
	{
		start = +start;
		return input.slice(start);
	};
});

fmiFe.directive('bsPopover', function() {
    return function(scope, element, attrs) {
        element.find("a[rel=popover]").popover({ placement: 'right', html: 'true'});
    };
});

function mainController($scope, $http, orderByFilter, $filter) {
	$scope.formData = {};
	$scope.newField = {};
	$scope.predicate = '';
	$scope.typePredicate = '';
	$scope.queryAdvanced = {};
	$scope.query = '';
	$scope.curPage = 0;
	$scope.pageSize = 5;
	var regexForDigitsNormal = /^\d{10}$/;
	var regexForDigitsSpecial = /^\+\d{10,}$/;
	
	$http.get('/api/phoneBook').success(function(data) {
			$scope.entries = data;
		}).error(function(data) {
			console.log('Error: ' + data);
	});
	
	$scope.createEntry = function() {
		if (Object.keys($scope.formData).length == 3) {
			var match = $scope.formData.Number.match(regexForDigitsNormal) || $scope.formData.Number.match(regexForDigitsSpecial);
			if (match !== null){
				$http.post('/api/phoneBook', $scope.formData).success(function(data) {
						$scope.formData = {};
						$scope.entries = data;
						$scope.curPage = 0;
						$scope.query = '';
						$scope.queryAdvanced = '';
						$('#exactMatch').prop('checked', false);
					}).error(function(data) {
						console.log('Error: ' + data);
					});
				$scope.clearErrors();
				$scope.clearSuccess();
				$scope.showSuccess();					
			}else {
				$scope.clearErrors();
				$scope.showErrors();
			}
		}
	};
	
	$(document).on("click", ".popOver-yes", function() {
		$http.delete('/api/phoneBook/'+ this.id).success(function(data) {
				$scope.entries = data;
				$scope.checkForFilter();
				if($scope.entries.length % $scope.pageSize === 0) {
					$scope.curPage -= 1;
				}
				if($scope.curPage < 0) {
					$scope.curPage = 0;
				}
				$scope.clearSuccess();
				$scope.showSuccess();
			}).error(function(data) {
				console.log('Error: ' + data);
			});
	});
	
	$(document).on("click", ".popOver-no", function() {
		//go back through the nested items until we reach the outer most div
		//then select its 2-nd child, which is the targeted anchor tag
		$(this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.childNodes[1]).click();
		
	});
	
	$scope.editEntry = function(field) {
        $scope.newField = angular.copy(field);
    };
    
    $scope.saveEntry = function(entry) {
		var match = entry.Number.match(regexForDigitsNormal) || entry.Number.match(regexForDigitsSpecial);
		if (match !== null){
            $http.put('/api/phoneBook/'+ entry._id, entry).success(function(data) {
					$scope.entries = data;
					$scope.checkForFilter();
					if($scope.entries.length % $scope.pageSize === 0) {
						$scope.curPage -= 1;
					}
				}).error(function(data) {
					console.log('Error: ' + data);
				});
			editMode = false;
			$scope.clearSuccess();
			$scope.showSuccess();
		}else {
				editMode = true;
				$scope.clearErrors();
				$scope.showErrors();
		}
    };
    
    $scope.cancel = function() {
		$http.get('/api/phoneBook').success(function(data) {
				$scope.entries = data;
				$scope.checkForFilter();
			}).error(function(data) {
				console.log('Error: ' + data);
		});
		$scope.clearErrors();
    };
	
	$scope.changePredicate = function() {
		if($('#sortOrder option:selected').val() == "asc") {
			$scope.predicate = $scope.typePredicate;
		} else if ($('#sortOrder option:selected').val() == "desc") {
			$scope.predicate = "-" + $scope.typePredicate;
		}
    };
	
	$scope.changeField = function() {
		if($('#sortField option:selected').val() == "fName") {
			$scope.typePredicate = "Fname";
		} else {
			$scope.typePredicate = "Lname";
		}
		if($('#sortOrder').val() !== null) {
			$scope.changePredicate();
		}
    };
	
	$scope.changePageSize = function() {
		if($('#pageSizeSelect').val() == 'other') {
			$('.custom-pagesize').css('visibility', 'visible');
		}
		else {
			$('.custom-pagesize').css('visibility', 'hidden');
			$('.custom-pagesize-value').val('');
			$scope.pageSize = $('#pageSizeSelect').val();
			$http.get('/api/phoneBook').success(function(data) {
					$scope.curPage = 0;
					$scope.entries = data;
					$scope.checkForFilter();
				}).error(function(data) {
					console.log('Error: ' + data);
			});
		}
    };
	
	$scope.customPageSize = function() {
		if($('.custom-pagesize-value').val() !== '') {
			$scope.pageSize = $('.custom-pagesize-value').val();
			$http.get('/api/phoneBook').success(function(data) {
					$scope.curPage = 0;
					$scope.entries = data;
					$scope.checkForFilter();
				}).error(function(data) {
					console.log('Error: ' + data);
			});
		}
	};
	
	$scope.toggleAdvancedSearch = function() {
		if($('#toggleAdvanced').is(':checked')) {
			$('#advancedSearch').css("visibility", "visible");
			$('#advancedSearch').fadeIn(1000);
			$('.basicSearch').fadeOut(800);
			$scope.query = '';
			togglePopovers();
			$http.get('/api/phoneBook').success(function(data) {
				$scope.entries = data;
				$scope.curPage = 0;
				}).error(function(data) {
					console.log('Error: ' + data);
			});
		}
		else {
			$('#advancedSearch').fadeOut(800);
			$('#exactMatch').prop('checked', false);
			$scope.query = '';
			$scope.queryAdvanced = '';
			$('.basicSearch').fadeIn(800);
			togglePopovers();
			$http.get('/api/phoneBook').success(function(data) {
				$scope.entries = data;
				$scope.curPage = 0;
				}).error(function(data) {
					console.log('Error: ' + data);
			});
		}
	};
	
	$scope.numberOfPages = function() {
		return Math.ceil($scope.entries.length / $scope.pageSize);
	};
	
	$scope.sort = function() {
		$http.get('/api/phoneBook').success(function(data) {
				$scope.sortedData = orderByFilter(data, $scope.predicate);
				$scope.entries = $scope.sortedData;
				$scope.checkForFilter();
			}).error(function(data) {
				console.log('Error: ' + data);
		});
	};	
	
    $scope.search = function() {
		$http.get('/api/phoneBook').success(function(data) {
				$scope.entries = data;
				$scope.curPage = 0;
				if($scope.query !== '') {
					$scope.entries = $filter('filter')($scope.entries, {$:$scope.query});
				}
			}).error(function(data) {
				console.log('Error: ' + data);
		});
    };
	
	$scope.searchAdvanced = function() {
		if($('#firstNameSearch').val() === ''){
			delete $scope.queryAdvanced.Fname;
		}
		if($('#lastNameSearch').val() === ''){
			delete $scope.queryAdvanced.Lname;
		}
		if($('#phoneSearch').val() === ''){
			delete $scope.queryAdvanced.Number;
		}
		if($('#exactMatch').is(':checked')) {
			$http.get('/api/phoneBook').success(function(data) {
					$scope.entries = data;
					$scope.curPage = 0;
					if($scope.queryAdvanced !== '') {
						$scope.entries = $filter('filter')($scope.entries, $scope.queryAdvanced, true);
					}
				}).error(function(data) {
					console.log('Error: ' + data);
			});
		}
		else {
			$http.get('/api/phoneBook').success(function(data) {
					$scope.entries = data;
					$scope.curPage = 0;
					if($scope.queryAdvanced !== '') {
						$scope.entries = $filter('filter')($scope.entries, $scope.queryAdvanced);
					}
				}).error(function(data) {
					console.log('Error: ' + data);
			});
		}
    };
	
	$scope.checkForFilter = function() {
		if($scope.query !== '') {
			$scope.entries = $filter('filter')($scope.entries, {$:$scope.query});
		}
		if($scope.queryAdvanced !== '') {
			$scope.entries = $filter('filter')($scope.entries, $scope.queryAdvanced);
		}
		if($('#exactMatch').is(':checked')) {
			if($scope.queryAdvanced !== '') {
				$scope.entries = $filter('filter')($scope.entries, $scope.queryAdvanced, true);
			}
		}
	};
	
	$scope.clearErrors = function() {
		$('.errors').css("visibility", "hidden");
		$('.errors').fadeOut(0);
		$('.errors').empty();
	};
	
	$scope.showErrors = function() {
		$('.errors').css("visibility", "visible");
		$('.errors').fadeIn(0);
		$('.errors').append('<i class="glyphicon glyphicon-remove-circle"></i> Please enter a valid phonenumber');
		
		setTimeout( function(){
			$('.errors').fadeOut(1500);
		}
		, 2000 );
	};
	
	$scope.clearSuccess = function() {
		$('.success').css("visibility", "hidden");
		$('.success').fadeOut(0);
		$('.success').empty();
	};
	
	$scope.showSuccess = function() {
		$('.success').css("visibility", "visible");
		$('.success').fadeIn(0);
		$('.success').append('<i class="glyphicon glyphicon-saved"></i> Success');
		
		setTimeout( function(){
			$('.success').fadeOut(1200);
		}
		, 1200 );
	};
}

function togglePopovers() {
	var visiblePopovers = $(".counter").filter(':visible');
	var number = visiblePopovers.length;
	for(var i = 0; i < number; i++) {
		$("a[name=" + visiblePopovers[i].id + "]").click();
	}
}