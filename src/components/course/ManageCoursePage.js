import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import {bindActionCreators} from 'redux';
import * as courseActions from '../../actions/courseActions';
import CourseForm from './CourseForm';
import {authorsFormattedForDropdown} from '../../selectors/selectors';
import toastr from 'toastr';

//The export here is for the benefit of enzyme testing so that we can test against and unconnected
// version of the Manage Course Page. So two things are being exported from this page.
//  The default connected compponent and this unconnected named import ManageCoursePage.
export class ManageCoursePage extends React.Component {
    constructor(props, context) {
        super(props, context);
        
        this.state = {
            course: Object.assign({}, this.props.course),
            errors: {},
            saving: false
        };

        this.updateCourseState = this.updateCourseState.bind(this);
        this.saveCourse = this.saveCourse.bind(this);
    }

    // We are using componentWillReceiveProps here because the course form will lose its information if the page
    // is refreshed. This is because state.course is being set in the constructor and when props is updated it is
    // not communicated back to the local state.

    // Note about componentWillReceiveProps: This React lifecycle function runs anytime props change, as well 
    // as anytime React thinks props might have changed. On occassion React cannot determine whether props might 
    // have been changed and so this lifecycle method will be run for safety. Because of the unpredictability of 
    // the call to this method the if block inside is written to suppress the setting of state when no actual 
    // props have been changed.
    componentWillReceiveProps(nextProps) {
        if (this.props.course.id != nextProps.course.id) {
            //Necessary to populate form when existing course is loaded directly
            this.setState({course: Object.assign({}, nextProps.course)});
        }
    }

    updateCourseState(event) {
        const field = event.target.name;
        let course = Object.assign({}, this.state.course);
        course[field] = event.target.value;
        return this.setState({course: course});
    }

    courseFormIsValid() {
        let formIsValid = true;
        let errors = {};

        if (this.state.course.title < 5) {
            errors.title = 'Title must be at least 5 characters.';
            formIsValid = false;
        }

        this.setState({errors: errors});
        return formIsValid;
    }

    saveCourse(event) {
        event.preventDefault();

        if (!this.courseFormIsValid()) {
            return;
        }

        this.setState({saving: true});
        this.props.actions.saveCourse(this.state.course)
            .then(() => this.redirect())
            .catch(error => {
                toastr.error(error);
                this.setState({saving: false});
            });
    }

    redirect() {
        this.setState({saving: false});
        toastr.success('Course Saved');
        //this.context.router.push('/courses');
    }

    render() {
        return (
                <CourseForm 
                    allAuthors={this.props.authors}
                    onChange={this.updateCourseState}
                    onSave={this.saveCourse}
                    course={this.state.course}
                    errors={this.state.errors}
                    saving={this.state.saving}
                />
        );
    }
}

ManageCoursePage.propTypes = {
    course: PropTypes.object.isRequired,
    authors: PropTypes.array.isRequired,
    actions: PropTypes.object.isRequired
};

ManageCoursePage.contextTypes = {
    router: PropTypes.object
};

function getCourseById(courses, id) {
    const course = courses.filter(course => course.id == id);
    if (course.length) return course[0];
    return null;
}

function mapStateToProps(state, ownProps) {
    const courseId = ownProps.params.id;

    let course = {id: '', watchHref: '', title: '', authorId: '', length: '', category: ''};
    
    //This if block prevents an error on page refresh of the course edit screen. On load therse are no courses yet.
    //The ajax call is still waiting in order to populate state.course. So this prevents the attempt to get
    //courses before they are available. When the ajax call is finally complete the store is updated via Redux and
    //mapStateToProps is fired again to notify React. While this prevents an error it does not populate the course 
    //detais back onto the form if the page is reloaded. componentWillReceiveProps above wiil do that. 
    if (courseId && state.courses.length > 0) {
        course = getCourseById(state.courses, courseId);
    }

    return {
        course: course,
        authors: authorsFormattedForDropdown(state.authors)
    };
}

function mapDispatchToProps(dispatch) {
    return {
        //although this composition is succint and the generally accepted practice it does obscure a key
        //relationship between dispatch and the actions. This is where actions are linked to the store.
        actions: bindActionCreators(courseActions, dispatch)
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(ManageCoursePage);